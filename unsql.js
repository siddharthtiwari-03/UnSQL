// @ts-check
const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { checkConstants } = require("./helpers/constants.helper")
const { prepSelect, prepWhere, prepJoin, prepOrders } = require("./helpers/main.helper")

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
     * @type {import("./defs/types").ConfigObject} (required) defines configurations for this model class
     * @static
     * @public
     * @memberof UnSQL
     */
    static config = {
        table: '',
        safeMode: true,
        devMode: false
    }

    /**
     * Find method
     * @method find
     * @description find method is used to fetch records from the database table
     * 
     * @param {Object} findParam (optional)
     * @param {string} [findParam.alias] (optional) local reference name for table mapped to this model
     * @param {import("./defs/types").SelectObject} [findParam.select] (optional) limits columns to be extracted, accepts an array of value(s), column name(s), wrapper methods etc
     * @param {import("./defs/types").JoinObject} [findParam.join] (optional) enables association of child table(s) to this model class
     * @param {import("./defs/types").WhereObject} [findParam.where] (optional) filter record(s) based on conditions
     * @param {'and'|'or'} [findParam.junction] (optional) defines the clause ('and'|'or') used to connect conditions inside 'where' and 'having' property
     * @param {string[]} [findParam.groupBy] (optional) groups record(s) based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [findParam.having] (optional) similar to 'where', filters record(s) additionally allows filter using aggregate methods
     * @param {{[column:string]:('asc'|'desc')}} [findParam.orderBy] (optional) re-order extracted record(s) based on single (or list of) column(s)
     * @param {number} [findParam.limit] (optional) limits the number of record(s) to be fetched
     * @param {number} [findParam.offset] (optional) sets the starting index for records to be fetched
     * @param {import("./defs/types").EncryptionConfig} [findParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [findParam.debug] (optional) enables different debug modes
     * @param {Object} [findParam.session] (optional)
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object[]}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * 
     * @static
     * @memberof UnSQL
     */
    static async find({ alias = undefined, select = [], join = [], where = {}, junction = 'and', groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encryption = {}, debug = false, session = undefined } = {}) {

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
            console.error(colors.red, `[Required]: Missing 'table' name inside 'config' of '${this.name}' model class`, colors.reset)
            return { success: false, error: `[Required]: Missing 'table' name inside 'config' of '${this.name}' model class` }
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

            const conn = await (session?.conn || this?.config?.pool?.getConnection() || this?.config?.connection)

            try {
                if (!session?.conn) await conn?.beginTransaction()

                if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)

                const prepared = conn.format(sql, values)

                handleQueryDebug(debug, sql, values, prepared)

                const [rows] = await conn.query(prepared)

                if (!session?.conn) await conn?.commit()

                if (debug === true) console.info(colors.green, 'Find query executed successfully!', colors.reset)
                if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)
                if (debug === true) console.info('\n')
                return { success: true, result: ((encryption?.mode || this?.config?.encryption?.mode) ? rows.pop() : rows) }

            } catch (error) {
                handleError(debug, error)
                if (conn && !session?.conn) await conn?.rollback()
                return { success: false, error }
            } finally {
                if (this?.config?.pool && !session?.conn) await conn?.release()
            }

        } catch (error) {
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }

    /**
     * @method save 
     * @description save method used in insert / update / upsert record(s) in the database table
     * 
     * @param {Object} saveParam (optional)
     * @param {string} [saveParam.alias] (optional) local reference name for table mapped to this model
     * @param {Object|Array<object>} saveParam.data object / array of objects to be inserted into the database table
     * @param {import("./defs/types").WhereObject} [saveParam.where] (optional) used to filter records to be updated
     * @param {'and'|'or'} [saveParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Array<string>} [saveParam.groupBy] (optional) allows to group result based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [saveParam.having] (optional) allows to perform comparison on the group of records, accepts nested conditions as object along with aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
     * @param {Object} [saveParam.upsert] (optional) object data to be updated in case of 'duplicate key entry' found in the database
     * @param {{[column:string]:{secret?:string, iv?:string, sha?:import("./defs/types").EncryptionSHAs} }} [saveParam.encrypt] (optional) define encryption overrides for column(s)
     * @param {import("./defs/types").EncryptionConfig} [saveParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [saveParam.debug] (optional) enables various debug mode
     * @param {Object} [saveParam.session] (optional) enables various debug mode
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * 
     * @static
     * @memberof UnSQL
     */
    static async save({ alias = undefined, data = [], where = {}, junction = 'and', groupBy = [], having = {}, upsert = {}, encrypt = {}, encryption = {}, debug = false, session = undefined }) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        // handle if table name is missing
        if (!this?.config?.table) {
            console.error(colors.red, `[Required]: Missing 'table' name inside 'config' of '${this.name}' model class`, colors.reset)
            return { success: false, error: `[Required]: Missing 'table' name inside 'config' of '${this.name}' model class` }
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

        let sql = 'SET AUTOCOMMIT = 0;\n'

        if (encryption?.mode) {
            sql += 'SET block_encryption_mode = ?;\n '
            values.push(encryption?.mode)
        } else if (this?.config?.encryption?.mode) {
            sql += 'SET block_encryption_mode = ?;\n '
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
                        if (!insertColumns.includes(col)) insertColumns.push(col)
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

                        // handle if encryption required
                        if (data[i][insertColumns[j]] && encrypt[insertColumns[j]]) {
                            if (typeof data[i][insertColumns[j]] === 'object') {
                                return { success: false, error: `Cannot encrypt '${insertColumns[j]}' (json datatype)` }
                            }
                            rowSql += `AES_ENCRYPT(?,${encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc')) ? ' ?,' : ''} UNHEX(SHA2(?, ?)))`
                        } else { // handle if encryption not required
                            rowSql += '?'
                        }

                        if (typeof data[i][insertColumns[j]] === 'object') {
                            values.push(JSON.stringify(data[i][insertColumns[j]]))
                        } else {
                            values.push(data[i][insertColumns[j]])
                        }

                        if (encrypt[insertColumns[j]]) {
                            values.push(encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)
                            if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                                values.push(encrypt[insertColumns[j]]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }
                            values.push(encrypt[insertColumns[j]]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)
                        }

                        rows.push(rowSql)

                    } // loop for columns ended

                    // this was pushing values to insertValues
                    if (i != 0) sql += ', '
                    sql += `(${rows.join(', ')})`

                }

                // loop for values ended
                values.push(...insertValues)
                if (debug === true || debug === 'query' || debug === 'benchmark' || debug === 'benchmark-query') console.info(colors.cyan, `Query generated, inserting records`, colors.reset)
                break
            }

            case typeof data === 'object': {
                // extract all columns from data object
                sql += 'SET '
                sql += Object.entries(data).map(([col, val]) => {

                    let rowSql = '?? = '

                    values.push(col)

                    if (encrypt[col]) { // if encryption required
                        if (typeof val === 'object' && !!val) {
                            return { success: false, error: `Cannot encrypt '${col}' (json datatype)` }
                        }
                        rowSql += 'AES_ENCRYPT(?'
                        rowSql += (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) ? ', ?' : ''
                        rowSql += ', UNHEX(SHA2(?, ?)))'
                        values.push(val)

                        values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                            values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                        }
                        values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                    } else { // if encryption not required
                        if (typeof val === 'object' && !!val) { // if val is json datatype
                            if (Object.keys(where).length > 0 || Object.keys(having).length > 0) {
                                rowSql += 'JSON_MERGE_PATCH(??, ?)'
                                values.push(col)
                            } else { // if no where or having clause
                                rowSql += '?'
                            }
                            values.push(!checkConstants(val) ? JSON.stringify(val) : val)
                        }
                        else { // if val is not json datatype
                            rowSql += '?'
                            values.push(val)
                        }
                    }

                    return rowSql
                }).join(', ') // loop for data object ended

                if (Object.keys(upsert).length) { // if upsert object is provided
                    sql += ' ON DUPLICATE KEY UPDATE '

                    sql += Object.entries(upsert).map(([col, val]) => {

                        let rowSql = '?? = '

                        values.push(col)

                        if (encrypt[col]) { // if encryption required
                            if (typeof val === 'object' && !!val) {
                                return { success: false, error: `Cannot encrypt '${col}' (json datatype)` }
                            }
                            rowSql += 'AES_ENCRYPT(?'
                            rowSql += (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) ? ', ?' : ''
                            rowSql += ', UNHEX(SHA2(?, ?)))'
                            values.push(val)

                            values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && this?.config?.encryption?.mode?.includes('-cbc'))) {
                                values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }
                            values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        } else { // if encryption not required
                            if (typeof val === 'object' && !!val) {
                                if (Object.keys(where).length > 0 || Object.keys(having).length > 0) { // if where or having clause
                                    rowSql += 'JSON_MERGE_PATCH(??, ?)'
                                    values.push(col)
                                } else { // if no where or having clause
                                    rowSql += '?'
                                }
                                values.push(!checkConstants(val) ? JSON.stringify(val) : val)
                            }
                            else { // if val is not json datatype
                                rowSql += '?'
                                values.push(val)
                            }
                        }

                        return rowSql
                    }).join(', ') // upsert loop ended
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

        const conn = await (session?.conn || this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            if (!session?.conn) await conn?.beginTransaction()

            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `${Object.keys(where).length || Object.keys(having).length ? 'Updated' : 'Inserted'} ${data.length} records in` + colors.reset)
            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result] = await conn.query(sql, values)

            if (!session?.conn) {
                await conn?.commit()
            }
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `${Object.keys(where).length || Object.keys(having).length ? 'Updated' : 'Inserted'} ${data.length} records in` + colors.reset)
            return { success: true, ...result.pop() }

        } catch (error) {
            handleError(debug, error)
            if (conn && !session?.conn) await conn?.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool && !session?.conn) await conn?.release()
        }


    }

    /**
     * @method delete
     * @description delete method is used to remove record(s) from the database table
     * 
     * @param {Object} deleteParam delete query object definition
     * @param {string} [deleteParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").WhereObject} [deleteParam.where] (optional) filter record(s) to be updated
     * @param {'and'|'or'} [deleteParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Array<string>} [deleteParam.groupBy] (optional) allows to group result based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [deleteParam.having] (optional) allows to perform comparison on the group of records, accepts nested conditions as object along with aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
     * @param {import("./defs/types").EncryptionConfig} [deleteParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [deleteParam.debug] (optional) enables various debug mode
     * @param {Object} [deleteParam.session] (optional) global session reference for transactions and rollback
     * 
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * 
     * @static
     * @memberof UnSQL
     */
    static async delete({ alias = undefined, where = {}, junction = 'and', groupBy = [], having = {}, debug = false, encryption = undefined, session = undefined } = {}) {

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
        let sql = 'SET AUTOCOMMIT = 0;\n'

        if (encryption?.mode) {
            sql += 'SET block_encryption_mode = ?;\n '
            values.push(encryption?.mode)
        } else if (this?.config?.encryption?.mode) {
            sql += 'SET block_encryption_mode = ?;\n '
            values.push(this?.config?.encryption?.mode)
        }

        sql += 'DELETE FROM ??'
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

        const conn = await (session?.conn || this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            if (!session?.conn) await conn?.beginTransaction()

            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)
            const [result] = await conn.query(sql, values)
            
            if (!session?.conn)await conn?.commit()

            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)
            return { success: true, ...result.pop() }

        } catch (error) {
            handleError(debug, error)
            if (conn && !session?.conn) await conn?.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool && !session?.conn) await conn?.release()
        }

    }

    /**
     * export record(s) from the table
     * @method export
     * @description This method exports record(s) (filtered/un-filtered) from the database table in form of the 'Json Array' into a json file
     * @param {Object} exportParam
     * @param {string|UnSQL} [exportParam.target] (optional) name of the file dynamically created '.json' file or reference to a valid UnSQL model class, defaults to the table name of exporting model class
     * @param {string} [exportParam.directory] (optional) rename default export directory
     * @param {import("./defs/types").SelectObject} [exportParam.select] (optional) limit column(s) to be extracted
     * @param {string} [exportParam.alias] (optional) local reference name to the exporting model
     * @param {import("./defs/types").JoinObject} [exportParam.join] (optional) join child table(s)
     * @param {import("./defs/types").WhereObject} [exportParam.where] (optional) filter record(s) using condition(s)
     * @param {string[]} [exportParam.groupBy] (optional) group record(s) based on column(s)
     * @param {import("./defs/types").HavingObject} [exportParam.having] (optional) filter record(s) using condition(s)/aggregate wrappers
     * @param {{[key:string]:'asc'|'desc'}} [exportParam.orderBy] (optional) 
     * @param {number} [exportParam.limit] (optional) limit record(s) to be extracted
     * @param {number} [exportParam.offset] (optional) set starting index
     * @param {import("./defs/types").EncryptionConfig} [exportParam.encryption] (optional) set encryption configuration
     * @param {'append'|'override'} [exportParam.mode] (optional) set writing mode
     * @param {import("./defs/types").DebugTypes} [exportParam.debug] (optional) set debug mode
     * 
     * @returns {Promise<{success: boolean, message?: string, error?: *}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * 
     * @static
     * @memberof UnSQL
     */
    static async export({ target = this.config.table, directory = 'exports_unsql', select = ['*'], alias = undefined, join = [], where = {}, groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encryption = undefined, mode = 'append', debug = false } = {}) {

        if (!this.config && ('TABLE_NAME' in this) && ('POOL' in this)) {
            console.warn(colors.yellow, `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'`, colors.reset)
            return { success: false, error: `[UnSQL Version Conflict]: '${this.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
        }

        if (!this?.config?.devMode) {
            console.error(colors.red, `[Action Denied]: Record(s) can only be exported from '${this?.name}' model if inside 'config', 'devMode' is set to 'true' (currently '${this?.config?.devMode}')`, colors.reset)
            return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${this?.name}' model if inside 'config', 'devMode' is set to 'true' (currently '${this?.config?.devMode}')` }
        }

        if (Object.getPrototypeOf(target) === UnSQL && !target['config']?.devMode) {
            console.error(colors.red, `[Action Denied]: Record(s) can only be exported from '${target['name']}' model if inside 'config', 'devMode' is set to 'true' (currently '${target['config']?.devMode}')`, colors.reset)
            return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${target['name']}' model if inside 'config', 'devMode' is set to 'true' (currently '${target['config']?.devMode}')` }
        }

        const result = await this.find({ alias, select, join, where, groupBy, having, orderBy, limit, offset, debug, encryption })

        if (!result.success) {
            console.error(colors.red, result.error?.sqlMessage || result.error?.message, colors.reset)
            return result
        }

        switch (true) {

            case (Object.getPrototypeOf(target) === UnSQL): {

                const cloned = await target['save']({ data: result.result, debug })

                if (!cloned.success) {
                    console.error(colors.red, cloned.error?.sqlMessage || cloned.error?.message, colors.reset)
                    return cloned
                }

                return { success: true, message: `${result?.result?.length} records exported to '${target['name']}' model` }
            }

            case typeof target === 'string': {
                const path = require('path')
                const dir = path.join(path.dirname(require.main?.filename || ''), directory)

                const fs = require('fs/promises')

                await fs.mkdir(dir, { recursive: true })

                if (mode === 'override')
                    await fs.writeFile(path.join(dir, target + '.json'), JSON.stringify(result.result))
                else
                    await fs.appendFile(path.join(dir, target + '.json'), JSON.stringify(result.result))

                return { success: true, message: `${result?.result?.length} records exported from '${this?.name}' model into '${directory}/${target}.json' file` }
            }

            default: {
                return { success: false, error: "Invalid Input! 'target' property can either be 'string' or a valid UnSQL model class" }
            }
        }

    }

    /**
     * Will reset the database table to initial state
     * @method reset
     * @param {Object} resetParam
     * @param {import("./defs/types").DebugTypes} [resetParam.debug] (optional) set debug mode
     * 
     * @returns {Promise<{success: boolean, message?: string, error: *}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
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
            console.error(colors.red, `[Action Denied]: '${this.name}' model can only be reset only if inside 'config', 'devMode' is set to 'true' (currently '${this?.config?.devMode}') and 'safeMode' is set to 'false' (currently '${this?.config?.safeMode}')`, colors.reset)
            return { success: false, error: `[Action Denied]: '${this.name}' model can only be reset only if inside 'config', 'devMode' is set to 'true' (currently '${this?.config?.devMode}') and 'safeMode' is set to 'false' (currently '${this?.config?.safeMode}')` }
        }

        const sql = 'TRUNCATE ??'
        const values = [this?.config?.table]

        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            await conn?.beginTransaction()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result] = await conn.query(sql, values)
            await conn?.commit()
            if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Removed records in` + colors.reset)
            return { success: true, ...result }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn?.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) await conn?.release()
        }

    }

}

/**
 * @class
 * @description provides various lifecycle methods to manage re-usable MySQL session (transactions)
 * @alias SessionManager
 * 
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class SessionManager {

    /**
     * @async
     * @method init
     * @description initiates transaction
     * @param {Object} pool
     * @returns {Promise<{success: boolean, message?: string, error?: Object}>}
     * @memberof SessionManager
     */
    async init(pool) {
        if (pool == undefined || pool == null) return { success: false, error: `MySQL 'connection' or connection 'pool' is required as parameter` }
        this.conn = await pool?.getConnection() || pool
        await this?.conn?.beginTransaction()
        return { success: true, message: 'Transaction initialized successfully!' }
    }

    /**
     * @async
     * @method rollback
     * @description rollbacks the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void>}
     * @memberof SessionManager
     */
    async rollback(close = true) {
        this?.conn?.rollback()
        if (close) await this.close()
    }

    /**
     * @async
     * @method commit
     * @description commits the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void>}
     * @memberof SessionManager
     */
    async commit(close = true) {
        try {
            await this?.conn?.commit()
        } catch (error) {
            this.rollback()
        } finally {
            if (close) await this.close()
        }
    }

    /**
     * @async
     * @method close
     * @description terminates the session and releases the connection
     * @returns {Promise<void>}
     * @memberof SessionManager
     */
    async close() {
        if (typeof this?.conn?.release === 'function') await this.conn?.release()
        delete this.conn
    }
}

module.exports = { UnSQL, SessionManager }