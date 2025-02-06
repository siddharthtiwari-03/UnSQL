// @ts-check
const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { prepOrders } = require("./helpers/order.helper")
const { prepSelect, prepWhere, prepJoin } = require("./helpers/main.helper")

/**
 * UnSQL is JavaScript based library to interact with structured databases (MySQL). It provides clean and easy interface for interaction for faster and smooth developers' experience.
 * @class
 * @alias UnSQL
 * @classdesc All model classes shall extend using UnSQL base class to access advanced functionalities
 * @namespace UnSQL
 * 
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class UnSQL {

    /**
     * config is a static property object, used to declare configurations relating to a model class
     * @type {{
     * table:string,
     * safeMode: boolean,
     * devMode?: boolean,
     * connection?: *,
     * pool?: *,
     * encryption?: import("./defs/types").EncryptionConfig
     * }} (required) accepts configurations related to model class as its properties
     * 
     * @static
     * @public
     * @memberof UnSQL
     */
    static config = {
        table: '',
        safeMode: true
    }

    /**
     * Find method
     * @method find
     * @description find method is used to fetch records from the database table
     * 
     * @param {object} findParam takes in various parameters that governs different query conditions and values
     * @param {string} [findParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").SelectObject} [findParam.select] (optional) accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...}, {date:...} etc
     * @param {import("./defs/types").JoinObject} [findParam.join] (optional) enables association of child tables to this model class (parent table)
     * @param {import("./defs/types").WhereObject} [findParam.where] (optional) used to filter records
     * @param {'and'|'or'} [findParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Array<string>} [findParam.groupBy] (optional) allows to group result based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [findParam.having] (optional) allows to perform comparison on the group of records, accepts nested conditions as object along with aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
     * @param {{[column:string]:('asc'|'desc')}} [findParam.orderBy] (optional) allows to order result based on single (or list of) column(s)
     * @param {number} [findParam.limit] (optional) limits the number of records to be fetched from the database table
     * @param {number} [findParam.offset] (optional) determines the starting index for records to be fetched from the database table
     * @param {import("./defs/types").EncryptionConfig} [findParam.encryption] (optional) defines query level encryption configurations
     * @param {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} [findParam.debug] (optional) enables different debug modes
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     * 
     * @static
     * @memberof UnSQL
     */
    static async find({ alias = undefined, select = [], join = [], where = {}, junction = 'and', groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encryption = {}, debug = false } = {}) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        // handle if connection object is missing
        if (!this?.config?.pool && !this?.config?.connection) {
            console.error(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide mysql connection or connection pool inside config (static property) of ' + this.name + ' model class' }
        }

        // handle if table name is missing
        if (!this?.config?.table) {
            console.error(colors.red, 'Please provide database table name inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
        }

        let sql = ''
        const values = []

        if (encryption?.mode) {
            sql += `SET block_encryption_mode = ?;\n`
            values.push(encryption?.mode)
        } else if (this?.config?.encryption?.mode) {
            sql += `SET block_encryption_mode = ?;\n`
            values.push(this?.config?.encryption?.mode)
        }

        sql += 'SELECT '

        try {

            const selectResp = prepSelect({ alias, select, encryption, ctx: this })
            sql += selectResp.sql
            values.push(...selectResp.values)

            sql += ' FROM ??'
            values.push(this.config.table)
            if (alias) {
                sql += ' ??'
                values.push(alias)
            }

            if (join.length) {
                const joinResp = prepJoin({ alias, join, encryption, ctx: this })
                sql += joinResp.sql
                values.push(...joinResp?.values)
            }

            if (Object.keys(where).length) {
                sql += ' WHERE '
                const whereResp = prepWhere({ alias, where, junction, encryption, ctx: this })
                sql += whereResp.sql
                values.push(...whereResp?.values)
            }

            if (groupBy.length) {
                sql += ' GROUP BY '
                sql += groupBy.map(gb => {
                    values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
                    return '??'
                }).join(', ')
            }

            if (Object.keys(having).length) {
                sql += ' HAVING '
                const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
                sql += havingResp.sql
                values.push(...havingResp.values)
            }

            if (Object.keys(orderBy).length) {
                sql += ' ORDER BY '
                const orderResp = prepOrders({ alias, orderBy })
                sql += orderResp.sql
                values.push(...orderResp.values)
            }

            if (typeof limit === 'number') {
                sql += ' LIMIT ? '
                values.push(limit)
            }

            if (typeof offset === 'number') {
                sql += ' OFFSET ? '
                values.push(offset)
            }

            const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)


            try {
                await conn.beginTransaction()
                if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)

                const prepared = conn.format(sql, values)

                handleQueryDebug(debug, sql, values, prepared)

                const [rows] = await conn.query(prepared)

                await conn.commit()
                if (debug === true) console.info(colors.green, 'Find query executed successfully!', colors.reset)
                if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)
                if (debug === true) console.info('\n')
                return { success: true, result: (encryption?.mode || this?.config?.encryption?.mode ? rows[1] : rows) }

            } catch (error) {
                handleError(debug, error)
                if (conn) await conn.rollback()
                return { success: false, error }
            } finally {
                if (this?.config?.pool) {
                    await conn.release()
                }
            }

        } catch (error) {
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }


    /**
     * @method save 
     * @description save method used in insert / update / upsert record(s) in the database table
     * 
     * @param {object} saveParam save query object definition
     * @param {string} [saveParam.alias] (optional) local alias name for the database table
     * @param {object|Array<object>} saveParam.data object / array of objects to be inserted into the database table
     * @param {import("./defs/types").WhereObject} [saveParam.where] (optional) used to filter records to be updated
     * @param {'and'|'or'} [saveParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Array<string>} [saveParam.groupBy] (optional) allows to group result based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [saveParam.having] (optional) allows to perform comparison on the group of records, accepts nested conditions as object along with aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
     * @param {object} [saveParam.upsert] (optional) object data to be updated in case of 'duplicate key entry' found in the database
     * @param {{[column:string]:{secret?:string, iv?:string, sha?:import("./defs/types").EncryptionSHAs} }} [saveParam.encrypt] (optional) define encryption overrides for column(s)
     * @param {import("./defs/types").EncryptionConfig} [saveParam.encryption] (optional) defines query level encryption configurations
     * @param {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} [saveParam.debug] (optional) enables various debug mode
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     * 
     * @static
     * @memberof UnSQL
     */
    static async save({ alias = undefined, data = [], where = {}, junction = 'and', groupBy = [], having = {}, upsert = {}, encrypt = {}, encryption = {}, debug = false }) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        if (Array.isArray(data) && (Object.keys(where).length || Object.keys(having).length || groupBy.length)) {
            console.warn(colors.yellow, 'Invalid combination to update multiple records', colors.reset)
            return { success: false, error: 'Invalid combination to update multiple records, only single object inside "data" property can be passed while updating records, array of objects detected' }
        }

        switch (true) {

            // handle if connection object is missing
            case (!this?.config?.pool && !this?.config?.connection): {
                console.error(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
                return { success: false, error: 'Please provide mysql connection or connection pool inside config (static property) of ' + this.name + ' model class' }
            }

            // handle if table name is missing
            case !this?.config?.table: {
                console.error(colors.red, 'Please provide database table name inside config (static property) of', this.name, 'model class', colors.reset)
                return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
            }

        }

        const values = []

        let sql = ''

        if (encryption?.mode) {
            sql += `SET block_encryption_mode = ?;\n `
            values.push(encryption?.mode)
        } else if (this?.config?.encryption?.mode) {
            sql += `SET block_encryption_mode = ?;\n `
            values.push(this?.config?.encryption?.mode)
        }

        sql += (Object.keys(where).length ? 'UPDATE ?? ' : 'INSERT INTO ?? ')

        values.push(this.config.table)

        if (alias) {
            sql += '?? '
            values.push(alias)
        }

        switch (true) {

            // handle if data is array of json object(s)
            case Array.isArray(data): {
                console.info(colors.cyan, (data.length > 1000 ? 'Large dataset detected, p' : 'P') + 'lease wait while UnSQL prepares query for each record, this might take few seconds...', colors.reset)
                const insertColumns = []

                // loop over each json object for columns
                for (let i = 0; i < data.length; i++) {

                    // extract keys from each object
                    Object.keys(data[i]).forEach(col => {

                        // track if col not already tracked
                        if (!insertColumns.includes(col)) {
                            insertColumns.push(col)
                        }

                    })

                }
                // loop for columns ended

                // this will patch placeholder for all columns in single array
                sql += `(??)`
                values.push(insertColumns)

                const insertValues = []

                sql += ' VALUES '

                // loop over each json object for values
                for (let i = 0; i < data.length; i++) {
                    const rows = []
                    for (let j = 0; j < insertColumns.length; j++) {

                        let rowSql = ''

                        if (!data[i][insertColumns[j]] || data[i][insertColumns[j]] === 'null' || !encrypt[insertColumns[j]]) {
                            rowSql += '?'
                            values.push(data[i][insertColumns[j]] || null)
                            rows.push(rowSql)
                            continue
                        }
                        rowSql += 'AES_ENCRYPT(?'
                        values.push(data[i][insertColumns[j]] || null)

                        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                            rowSql += ', ?'
                        }

                        rowSql += ', UNHEX(SHA2(?, ?))'

                        values.push(encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                            values.push(encrypt[insertColumns[j]]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                        }

                        values.push(encrypt[insertColumns[j]]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        rowSql += ')'

                        rows.push(rowSql)

                    }

                    // this was pushing values to insertValues
                    if (i != 0) sql += ', '
                    sql += `(${rows.join(', ')})`

                }

                // loop for values ended
                values.push(...insertValues)
                console.info(colors.cyan, `Query generated, inserting records`, colors.reset)
                break
            }

            case typeof data === 'object': {
                // extract all columns from data object
                sql += 'SET '
                sql += Object.entries(data).map(([col, val]) => {

                    let rowSql = '?? = '

                    values.push(col)

                    // check if encryption is required
                    if (encrypt[col]) {
                        rowSql += 'AES_ENCRYPT(?'
                        values.push(val)

                        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                            rowSql += ', ?'
                        }

                        rowSql += ', UNHEX(SHA2(?, ?)))'

                        values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                            values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                        }

                        values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        rowSql += ')'

                    } else {
                        rowSql += '?'
                        values.push(val)
                    }

                    return rowSql
                }).join(', ')

                if (Object.keys(upsert).length) {
                    sql += ' ON DUPLICATE KEY UPDATE '

                    sql += Object.entries(upsert).map(([col, val]) => {

                        let rowSql = '?? = '

                        values.push(col)

                        // check if encryption is required
                        if (encrypt[col]) {
                            rowSql += 'AES_ENCRYPT(?'
                            values.push(val)

                            if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                                rowSql += ', ?'
                            }

                            rowSql += ', UNHEX(SHA2(?, ?)))'

                            values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                                values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }

                            values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                            rowSql += ')'

                        } else {
                            rowSql += '?'
                            values.push(val)
                        }

                        return rowSql
                    }).join(', ')
                }

                if (Object.keys(where).length) {
                    sql += ' WHERE '
                    const whereResp = prepWhere({ alias, where, junction, encryption, ctx: this })
                    sql += whereResp.sql
                    values.push(...whereResp.values)
                }

                if (groupBy.length) {
                    sql += ' GROUP BY '
                    sql += groupBy.map(gb => {
                        values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
                        return '??'
                    }).join(', ')
                }

                if (Object.keys(having).length) {
                    sql += ' HAVING '
                    const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
                    sql += havingResp.sql
                    values.push(...havingResp.values)
                }

                break
            }

            default: {
                return { success: false, error: "Invalid data type! Data argument accepts only object or array of objects" }
            }

        }

        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            await conn.beginTransaction()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `${Object.keys(where).length || Object.keys(having).length ? 'Updated' : 'Inserted'} ${data.length} records in` + colors.reset)
            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result, row, err] = await conn.query(sql, values)

            await conn.commit()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `${Object.keys(where).length || Object.keys(having).length ? 'Updated' : 'Inserted'} ${data.length} records in` + colors.reset)
            return { success: true, ...(encryption?.mode || this?.config?.encryption?.mode ? result[1] : result) }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
            }
        }


    }

    /**
     * @method delete
     * @description delete method is used to remove record(s) from the database table
     * 
     * @param {object} deleteParam delete query object definition
     * @param {string} [deleteParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").WhereObject} [deleteParam.where] (optional) used to filter records to be updated
     * @param {'and'|'or'} [deleteParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Array<string>} [deleteParam.groupBy] (optional) allows to group result based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [deleteParam.having] (optional) allows to perform comparison on the group of records, accepts nested conditions as object along with aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
     * @param {import("./defs/types").EncryptionConfig} [deleteParam.encryption] (optional) defines query level encryption configurations
     * @param {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} [deleteParam.debug] (optional) enables various debug mode
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     * 
     * @static
     * @memberof UnSQL
     */
    static async delete({ alias = undefined, where = {}, junction = 'and', groupBy = [], having = {}, debug = false, encryption = undefined } = {}) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        switch (true) {

            // handle if connection object is missing
            case !this?.config?.pool && !this?.config?.connection: {
                console.error(colors.red, `[Missing]: Either of Mysql 'connection' or connection 'pool' property is required inside 'config' of '${this.name}' model class`, colors.reset)
                return { success: false, error: `Either of Mysql 'connection' or connection 'pool' property is required inside 'config' of '${this.name}' model class` }
            }

            // handle if table name is missing
            case !this?.config?.table: {
                console.error(colors.red, `[Missing]: 'table' name property missing inside 'config' property of '${this.name}' model class`, colors.reset)
                return { success: false, error: `'table' name property missing inside 'config' property of '${this.name}' model class` }
            }

            // handle delete all if safe mode is active
            case !Object.keys(where).length && (this?.config?.safeMode || !('safeMode' in this.config)): {
                console.error(colors.red + `Delete all records from database table in 'safeMode' is prohibited!` + colors.reset)
                console.error(colors.yellow + `Kindly disable 'safeMode' in 'config' property of '${this?.name}' model class or provide a filter using 'where' or 'having' property to restrict delete action!` + colors.reset)
                return { success: false, error: `Please disable 'safeMode' inside 'config' property of '${this.name}' model class` }
            }
        }

        const values = []

        let sql = 'DELETE FROM ??'
        values.push(this.config.table)

        if (alias) {
            sql += ' ??'
            values.push(alias)
        }

        if (Object.keys(where).length) {
            sql += ' WHERE '
            const whereResp = prepWhere({ alias, where, junction, encryption, ctx: this })
            sql += whereResp.sql
            values.push(...whereResp.values)
        }

        if (groupBy.length) {
            sql += ' GROUP BY '
            sql += groupBy.map(gb => {
                values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
                return '??'
            }).join(', ')
        }

        if (Object.keys(having).length) {
            sql += ' HAVING '
            const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
            sql += havingResp.sql
            values.push(...havingResp.values)
        }

        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            await conn.beginTransaction()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)
            const [result] = await conn.query(sql, values)
            await conn.commit()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)
            return { success: true, ...result }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
            }
        }

    }

    /**
     * export record(s) from the table
     * @method export
     * @description This method exports record(s) (filtered/un-filtered) from the database table in form of the 'Json Array' into a json file
     * @param {object} exportParam
     * @param {string} [exportParam.filename]
     * @param {string} [exportParam.directory]
     * @param {import("./defs/types").SelectObject} [exportParam.select]
     * @param {import("./defs/types").WhereObject} [exportParam.where]
     * @param {'append'|'override'} [exportParam.mode]
     * @param {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} [exportParam.debug]
     * 
     * @returns {Promise<{success: boolean, message?: string, error?: *}>}
     * 
     * @static
     * @memberof UnSQL
     */
    static async export({ filename = this.config.table, directory = 'exports_unsql', select = ['*'], where = {}, mode = 'append', debug = false } = {}) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        if (!this?.config?.devMode) {
            console.error(colors.red, `[Action Denied]: Record(s) can only be exported from '${this?.name}' model if inside 'config', 'devMode' is set to 'true' (currently ${this?.config?.devMode})`, colors.reset)
            return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${this?.name}' model if inside 'config', 'devMode' is set to 'true' (currently ${this?.config?.devMode})` }
        }

        const path = require('path')
        const dir = path.join(path.dirname(require.main?.filename || ''), directory)

        const fs = require('fs/promises')

        await fs.mkdir(dir, { recursive: true })

        const result = await this.find({ select, where, debug })

        if (!result.success) {
            console.error(colors.red, result.error?.sqlMessage || result.error?.message, colors.reset)
            return result
        }

        if (mode === 'override')
            await fs.writeFile(path.join(dir, filename + '.json'), JSON.stringify(result.result))
        else
            await fs.appendFile(path.join(dir, filename + '.json'), JSON.stringify(result.result))


        return { success: true, message: `${result.result.length} records exported from ${this?.name} model` }
    }

    /**
     * Will reset the database table to initial state
     * @method reset
     * @param {object} resetParam
     * @param {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} [resetParam.debug]
     * 
     * @returns {Promise<{success: boolean, message?: string, error: *}>}
     * 
     * @static
     * @memberof UnSQL
     */
    static async reset({ debug = false } = {}) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        if (!this?.config?.devMode || this?.config?.safeMode) {
            console.error(colors.red, `[Action Denied]: '${this.name}' model can only be reset only if inside 'config', 'devMode' is set to 'true' (currently ${this?.config?.devMode}) and 'safeMode' is set to 'false' (currently ${this?.config?.safeMode})`, colors.reset)
            return { success: false, error: `[Action Denied]: '${this.name}' model can only be reset only if inside 'config', 'devMode' is set to 'true' (currently ${this?.config?.devMode}) and 'safeMode' is set to 'false' (currently ${this?.config?.safeMode})` }
        }

        const values = []
        let sql = 'TRUNCATE ??'
        values.push(this?.config?.table)

        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            await conn.beginTransaction()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result] = await conn.query(sql, values)
            await conn.commit()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)
            return { success: true, ...result }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
            }
        }

    }

}


module.exports = { UnSQL }