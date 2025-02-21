// @ts-check
const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { checkConstants } = require("./helpers/constants.helper")
const { prepSelect, prepWhere, prepJoin, prepOrderBy, patchGroupBy, patchLimit, prepEncryption, isVariable } = require("./helpers/main.helper")
const { prepName } = require("./helpers/name.helper")
const { prepPlaceholder } = require("./helpers/placeholder.helper")

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

    static _variableCount = 0

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
     * @returns {Promise<{success:false, error?:object}|{success:true, result?:object[], insertId?:number, changes?:number}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * 
     * @static
     * @memberof UnSQL
     */
    static async find({ alias = undefined, select = [], join = [], where = {}, junction = 'and', groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encryption = {}, debug = false, session = undefined } = {}) {

        const defaultResp = handleDefaults(this)

        if (!defaultResp?.success) return defaultResp

        patchDefaults(this)

        const values = []

        let sql = 'SELECT '

        try {
            const selectResp = prepSelect({ alias, select, encryption, ctx: this })
            sql += selectResp.sql
            values.push(...selectResp.values)

            sql += ' FROM ' + (this?.config?.dialect === 'mysql' ? '??' : this.config?.table)
            if (this?.config?.dialect === 'mysql') {
                values.push(this.config.table)
                if (alias) {
                    sql += ' ??'
                    values.push(alias)
                }
            } else if (alias) {
                sql += ` ${alias}`
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

            const groupByResp = patchGroupBy({ groupBy, alias, ctx: this })
            sql += groupByResp.sql
            values.push(...groupByResp.values)

            if (Object.keys(having).length) {
                sql += ' HAVING '
                const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
                sql += havingResp.sql
                values.push(...havingResp.values)
            }

            const orderResp = prepOrderBy({ alias, orderBy, ctx: this })
            sql += orderResp.sql
            values.push(...orderResp.values)

            const limitResp = patchLimit(limit, this)
            sql += limitResp.sql
            values.push(...limitResp.values)

            const offsetResp = patchLimit(offset, this, 'OFFSET')
            sql += offsetResp.sql
            values.push(...offsetResp.values)

            switch (true) {
                case this?.config?.dialect === 'mysql':
                    return await executeMySQL({ sql, values, encryption, debug, session, config: this?.config })
                case this?.config?.dialect === 'postgresql':
                    return await executePostgreSQL({ sql, values, debug, config: this?.config })
                case this?.config?.dialect === 'sqlite':
                    return await executeSqlite({ sql, values, config: this?.config, debug })
                default:
                    return { success: false, error: 'Invalid dialect provided in config' }
            }

        } catch (error) {
            handleError(debug, error)
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }

    /**
     * @method save 
     * @description save method used in insert / update / upsert record(s) in the database table
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
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static async save({ alias = undefined, data = [], where = {}, junction = 'and', groupBy = [], having = {}, upsert = {}, encrypt = {}, encryption = {}, debug, session }) {

        patchDefaults(this)

        const defaultResp = handleDefaults(this)

        if (!defaultResp?.success) return defaultResp

        if (Array.isArray(data) && (Object.keys(where).length || Object.keys(having).length || groupBy.length)) {
            console.warn(colors.yellow, 'Invalid combination to update multiple records', colors.reset)
            return { success: false, error: 'Invalid combination to update multiple records, only single object inside "data" property can be passed while updating records, array of objects detected' }
        }


        if (!Object.keys(where).length && !Object.keys(having).length && this?.config?.dialect != 'mysql')
            data = Array.isArray(data) ? data : [data]

        const values = []
        let sql = ''

        sql += (Object.keys(where).length ? 'UPDATE ' : 'INSERT INTO ') + (this?.config?.dialect === 'mysql' ? '??' : this.config?.table) + ' '

        if (this?.config?.dialect === 'mysql') {
            values.push(this.config.table)

            if (alias) {
                sql += ' ??'
                values.push(alias)
            }
        } else if (alias) {
            sql += ` ${alias}`
        }

        try {

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
                    if (this?.config?.dialect === "mysql") {
                        sql += `(??)`
                        values.push(insertColumns)
                    } else {
                        sql += `(${insertColumns.join(', ')})`
                    }

                    sql += ' VALUES '
                    // loop over each entry (json object) for values
                    for (let i = 0; i < data.length; i++) {
                        console.log('looping over i:', i, insertColumns[i])
                        const properties = []
                        for (let j = 0; j < insertColumns.length; j++) { // loop over each property
                            let propSql = this?.config?.dialect === 'postgresql' ? `${this._variableCount++}` : '?'
                            if (typeof data[i][insertColumns[j]] === 'object') {
                                if (this?.config?.dialect === 'mysql') {
                                    values.push(JSON.stringify(data[i][insertColumns[j]]))
                                } else if (this?.config?.dialect === 'postgresql') {
                                    this._variableCount-- // revert back variable count since not being used
                                    propSql = prepJsonbUpdate(insertColumns[j], data[i][insertColumns[j]], (Object.keys(where).length || Object.keys(having).length))
                                }
                            } else {
                                values.push(data[i][insertColumns[j]])
                            }

                            const encResp = prepEncryption({ placeholder: propSql, col: insertColumns[j], ctx: this, encrypt, encryption })
                            propSql = encResp.sql // replace previous sql with encryption wrapper
                            values.push(...encResp?.values) // values are patched not replaced
                            properties.push(propSql)
                        } // loop for properties ended

                        // this prefixes ',' before each (except 1st) entry
                        sql += (i != 0 ? ', ' : '') + `(${properties.join(', ')})`
                    }
                    // loop for values ended
                    if (debug === true || debug === 'query' || debug === 'benchmark' || debug === 'benchmark-query') console.info(colors.cyan, `Query generated, inserting records`, colors.reset)
                    break
                }

                case typeof data === 'object': {
                    // extract all columns from data object
                    sql += 'SET '
                    sql += Object.entries(data).map(([col, val]) => {

                        let propSql = ''

                        // const colPlaceholder = prepPlaceholder({ value: col, alias, ctx: this })
                        const colPlaceholder = (this?.config?.dialect === 'mysql' ? '??' : col)
                        propSql += colPlaceholder + ' = '
                        if (isVariable(colPlaceholder)) {
                            const colName = prepName({ value: col, alias })
                            values.push(colName)
                        }

                        if (typeof val === 'object') {
                            if (this?.config?.dialect === 'mysql') {
                                propSql += '?'
                                values.push(JSON.stringify(val))
                            } else if (this?.config?.dialect === 'postgresql') {
                                propSql += prepJsonbUpdate(col, val, (Object.keys(where).length || Object.keys(having).length))
                            }
                        } else {
                            values.push(val)
                            if (encrypt[col]) {
                                const encResp = prepEncryption({
                                    placeholder: (this?.config?.dialect === 'postgresql' ? `$${this._variableCount++}` : '?'), col, ctx: this, encrypt, encryption
                                })
                                console.log('encResp', encResp)
                                propSql += encResp.sql // replace previous sql with encryption wrapper
                                values.push(...encResp?.values) // values are patched not replaced
                            } else {
                                propSql += this?.config?.dialect === 'postgresql' ? `$${this._variableCount++}` : '?'
                            }
                        }

                        return propSql

                    }).join(', ') // loop for data object ended

                    if (Object.keys(upsert).length) { // if upsert object is provided
                        sql += ' ON DUPLICATE KEY UPDATE '

                        sql += Object.entries(upsert).map(([col, val]) => {

                            let propSql = ''

                            const colPlaceholder = (this?.config?.dialect === 'mysql' ? '??' : col)
                            propSql += colPlaceholder + ' = '
                            if (isVariable(colPlaceholder)) {
                                const colName = prepName({ value: col, alias })
                                values.push(colName)
                            }

                            if (typeof val === 'object') {
                                if (this?.config?.dialect === 'mysql') {
                                    values.push(JSON.stringify(val))
                                } else if (this?.config?.dialect === 'postgresql') {
                                    propSql += prepJsonbUpdate(col, val, (Object.keys(where).length || Object.keys(having).length))
                                }
                            } else {
                                values.push(val)
                                if (encrypt[col]) {
                                    const encResp = prepEncryption({
                                        placeholder: (this?.config?.dialect === 'postgresql' ? `$${this._variableCount++}` : '?'), col, ctx: this, encrypt, encryption
                                    })
                                    console.log('encResp', encResp)
                                    propSql += encResp.sql // replace previous sql with encryption wrapper
                                    values.push(...encResp?.values) // values are patched not replaced
                                } else {
                                    propSql += this?.config?.dialect === 'postgresql' ? `$${this._variableCount++}` : '?'
                                }
                            }

                            return propSql

                        }).join(', ') // upsert loop ended
                    }

                    if (Object.keys(where).length) {
                        sql += ' WHERE '
                        const whereResp = prepWhere({ alias, where, junction, encryption, ctx: this })
                        sql += whereResp.sql
                        values.push(...whereResp.values)
                    }

                    const groupByResp = patchGroupBy({ groupBy, alias, ctx: this })
                    sql += groupByResp.sql
                    values.push(...groupByResp.values)

                    if (Object.keys(having).length) {
                        sql += ' HAVING '
                        const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
                        sql += havingResp.sql
                        values.push(...havingResp.values)
                    }

                    break
                }

                default:
                    return { success: false, error: "Invalid data type! Data argument accepts only object or array of objects" }
            }

            switch (true) {
                case this.config?.dialect === 'mysql':
                    return await executeMySQL({ sql, values, encryption, debug, session, config: this?.config })
                case this.config?.dialect === 'postgresql':
                    sql += ' RETURNING *'
                    return await executePostgreSQL({ sql, values, debug, config: this?.config })
                case this?.config?.dialect === 'sqlite':
                    return await executeSqlite({ sql, values, debug, config: this?.config, session })
                default:
                    return { success: false, error: 'Invalid dialect provided in config' }
            }

        } catch (error) {
            console.error('error message', error?.message)
            return { success: false, error }
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

        patchDefaults(this)

        const defaultResp = handleDefaults(this)

        if (!defaultResp.success) return defaultResp

        // handle delete all if safe mode is active
        if (!Object.keys(where).length && this?.config?.safeMode) {
            console.error(colors.red + `Delete all records from database table in 'safeMode' is prohibited!` + colors.reset)
            console.error(colors.yellow + `Kindly disable 'safeMode' in 'config' property of '${this?.name}' model class or provide a filter using 'where' or 'having' property to restrict delete action!` + colors.reset)
            return { success: false, error: `Please disable 'safeMode' inside 'config' property of '${this.name}' model class` }
        }

        const values = []

        let sql = `DELETE FROM ${(this?.config?.dialect === 'mysql' ? '??' : this.config?.table)} `

        if (this?.config?.dialect === 'mysql') {
            values.push(this.config.table)

            if (alias) {
                sql += ' ??'
                values.push(alias)
            }
        } else if (alias) {
            sql += ` ${alias}`
        }

        if (Object.keys(where).length) {
            sql += ' WHERE '
            const whereResp = prepWhere({ alias, where, junction, encryption, ctx: this })
            sql += whereResp.sql
            values.push(...whereResp.values)
        }

        const groupByResp = patchGroupBy({ groupBy, alias, ctx: this })
        sql += groupByResp.sql
        values.push(...groupByResp.values)

        if (Object.keys(having).length) {
            sql += ' HAVING '
            const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx: this })
            sql += havingResp.sql
            values.push(...havingResp.values)
        }

        switch (this?.config?.dialect) {
            case 'mysql':
                return await executeMySQL({ sql, values, encryption, debug, session, config: this?.config })
            case 'postgresql':
                return await executePostgreSQL({ sql, values, debug, config: this?.config })
            case 'sqlite':
                return await executeSqlite({ sql, values, config: this?.config, debug, methodType: 'run', session })
            default:
                return { success: false, error: 'Invalid dialect provided in config' }
        }
    }

    /**
     * @method rawQuery
     * @description rawQuery method is used to execute raw SQL query on the database
     * @param {Object} rawQueryParams
     * @param {string} rawQueryParams.sql (required) SQL query to be executed
     * @param {Array<any>|Object} [rawQueryParams.values] (optional) values to be interpolated in the query
     * @param {import("./defs/types").EncryptionConfig} [rawQueryParams.encryption] (optional) enables debug mode
     * @param {import("./defs/types").DebugTypes} [rawQueryParams.debug] (optional) enables debug mode
     * @param {Object} [rawQueryParams.session] (optional) global session reference for transactions and rollback
     * @param {'run'|'all'|'exec'} [rawQueryParams.methodType=all] (optional) used only with 'sqlite'
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static async rawQuery({ sql = '', values = [], debug = false, encryption = undefined, session = undefined, methodType = 'all' }) {
        switch (this?.config?.dialect) {
            case 'mysql':
                return await executeMySQL({ sql, values, encryption, debug, session, config: this?.config })
            case 'postgresql':
                return await executePostgreSQL({ sql, values, debug, config: this?.config })
            case 'sqlite':
                return await executeSqlite({ sql, values, debug, config: this?.config, })
            default:
                return { success: false, error: 'Invalid dialect provided in config' }
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

        patchDefaults(this)

        const defaultResp = handleDefaults(this)

        if (!defaultResp.success) return defaultResp

        if (!this?.config?.devMode) return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${this?.name}' model if inside 'config', 'devMode' is set to 'true' (currently '${this?.config?.devMode}')` }

        if (Object.getPrototypeOf(target) === UnSQL && !target['config']?.devMode) return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${target['name']}' model if inside 'config', 'devMode' is set to 'true' (currently '${target['config']?.devMode}')` }

        const result = await this.find({ alias, select, join, where, groupBy, having, orderBy, limit, offset, debug, encryption })

        if (!result.success) {
            console.error(colors.red, result.error?.sqlMessage || result.error?.message, colors.reset)
            return result
        }

        switch (true) {

            case (Object.getPrototypeOf(target) === UnSQL): {
                const cloned = await target['save']({ data: result.result, encryption, debug })
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

            default:
                return { success: false, error: "Invalid Input! 'target' property can either be 'string' or a valid UnSQL model class" }
        }

    }

    /**
     * Will reset the database table to initial state
     * @method reset
     * @param {Object} resetParam
     * @param {import("./defs/types").DebugTypes} [resetParam.debug] (optional) set debug mode
     * @returns {Promise<{success:boolean, message?:string, result?:*, error?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static async reset({ debug = false } = {}) {

        patchDefaults(this)

        const defaultResp = handleDefaults(this)

        if (!defaultResp.success) return defaultResp

        const sql = 'TRUNCATE ' + (this?.config?.dialect === 'mysql' ? '??' : this.config?.table)
        const values = []

        if (this?.config?.dialect === 'mysql') values.push(this.config.table)

        switch (this?.config?.dialect) {
            case 'mysql':
                return await executeMySQL({ sql, values, debug, config: this?.config })
            case 'postgresql':
                return await executePostgreSQL({ sql, values, debug, config: this?.config })
            default:
                return { success: false, error: 'Invalid dialect provided in config' }
        }

    }

}

/**
 * @function executeMySQL
 * @description executes the SQL query
 * @param {Object} options
 * @param {string} options.sql SQL query to be executed
 * @param {Array<any>} options.values values to be interpolated in the query
 * @param {import("./defs/types").DebugTypes} [options.debug] enables debug mode
 * @param {Object} [options.session] global session reference for transactions and rollback
 * @param {Object} [options.config] global configuration object
 * @param {import("./defs/types").EncryptionConfig} [options.encryption] enables encryption
 * @returns {Promise<{success:false, error:*}|{success:true, result:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'results'
 */
const executeMySQL = async ({ sql, values, debug = false, session = undefined, config, encryption = undefined }) => {

    const conn = await (session?.conn || config?.pool?.getConnection() || config?.connection)

    try {
        if (!session?.conn) await conn?.beginTransaction()

        if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.time(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)

        if ((encryption?.mode && encryption?.mode != config?.dbEncryptionMode) || (config?.encryption?.mode && config?.encryption?.mode != config?.dbEncryptionMode)) {
            try {
                const encPrepared = await conn.format('SET block_encryption_mode = ?', [encryption?.mode || config?.encryption?.mode])
                const [encResp] = await conn?.execute(encPrepared)
                if (!session?.conn) await conn?.commit()
            } catch (error) {
                throw { message: `[Error]: ${error?.message}`, cause: `While setting encryption mode to: '${encryption?.mode || config?.encryption?.mode}'` }
            }
        }

        const prepared = conn.format(sql, values)

        handleQueryDebug(debug, sql, values, prepared)

        const [result] = await conn.execute(prepared)
        if (!session?.conn) await conn?.commit()
        // if (debug === true) console.info(colors.green, 'Query executed successfully!', colors.reset)
        // if (debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true) console.timeEnd(colors.blue + 'UnSQL benchmark: ' + colors.reset + colors.cyan + `Fetched records in` + colors.reset)
        if (debug === true) console.info('\n')
        return { success: true, result }
    } catch (error) {
        handleError(debug, error)
        if (conn && !session?.conn) await conn?.rollback()
        return { success: false, error }
    } finally {
        if (config?.pool && !session?.conn) await conn?.release()
    }

}

/**
 * patch defaults to config context
 * @function patchDefaults
 * @description patches default values to config context
 * @param {object} options 
 * @returns {Promise<{success:true, result:*}|{success:false, error:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
const executePostgreSQL = async ({ sql, values, debug = false, config, session = undefined, encryption = undefined }) => {

    const client = await (session?.conn || config?.pool?.connect())

    try {
        if (!session?.conn) await client.query('BEGIN')

        handleQueryDebug(debug, sql, values)

        const { rows, error } = await client.query(sql, values)

        if (!session?.conn) await client.query('COMMIT')

        if (error) {
            if (!session?.conn) await client.query('ROLLBACK')
            handleError(debug, error)
            return { success: false, error: { ...error, message: error.message } }
        }

        return { success: true, result: rows }
    } catch (error) {
        if (!session?.conn) await client.query('ROLLBACK')
        handleError(debug, error)
        return { success: false, error: { ...error, message: error.message } }
    } finally {
        if (!session?.conn) await client.release()
    }
}

/**
 * executes sqlite queries
 * @function executeSqlite
 * @param {Object} options
 * @param {string} options.sql
 * @param {Array} options.values
 * @param {import("./defs/types").DebugTypes} [options.debug]
 * @param {import("./defs/types").ConfigObject} [options.config]
 * @param {'all'|'run'|'exec'} [options.methodType=all]
 * @param {*} [options.session]
 * @returns {Promise<{success:boolean, result?:Array, insertId?:number, changes?:number, error?:*}>}
 */
async function executeSqlite({ sql, values, debug = false, config, methodType = 'all', session = undefined }) {
    console.log('executeSqlite invoked')
    const db = (session?.pool || config?.pool)

    return new Promise((resolve, reject) => {
        if (typeof db[methodType] != 'function') return resolve({ success: false, error: `Invalid method '${methodType}' detected!` })
        handleQueryDebug(debug, sql, values)

        try {

            if (methodType === 'run' && !session?.pool) { // 'session' is not managing tx/commit/rollback and query type is 'run'

                db.serialize(() => { // serialize all queries
                    db.run('BEGIN TRANSACTION', txError => { // initiate tx
                        if (txError) return resolve({ success: false, error: { ...txError, message: txError.message } }) // handle if tx fails

                        db.run(sql, values, function (error) { // run actual query
                            if (error) return db.run('ROLLBACK', () => resolve({ success: false, error: { ...error, message: error.message } })) // handle actual query error

                            db.run('COMMIT', commitError => {
                                if (commitError) return resolve({ success: false, error: { ...commitError, message: commitError.message } }) // handle if commit fails

                                return resolve({ success: true, insertId: this.lastID, changes: this.changes }) // return result of run query
                            })
                        })
                    })
                })

            } else { // when 'session' is managing tx/commit/rollback

                db[methodType](sql, values, (error, result) => {
                    if (error) {
                        return resolve({ success: false, error: { ...error, message: error.message } })
                    }
                    const payload = {
                        success: true,
                        ...(methodType === 'all' && { result }),
                        ...(this?.lastID !== undefined && { insertId: this?.lastID }),
                        ...(this?.changes !== undefined && { changes: this?.changes })
                    }
                    return resolve(payload)
                })

            }

        } catch (error) {
            console.error('error while executing sqlite', error)
            return resolve({ success: false, error: { ...error, message: error.message } })
        }
    })
}

/**
 * patch defaults to config context
 * @function patchDefaults
 * @description patches default values to config context
 * @param {object} ctx 
 * @returns {void}
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
const patchDefaults = ctx => {
    if (!('devMode' in ctx.config)) {
        console.log('devMode not found in config, default patched')
        ctx.config.devMode = false
    }
    if (!('safeMode' in ctx.config)) {
        console.log('safeMode not found in config, default patched')
        ctx.config.safeMode = true
    }
    if (!('dialect' in ctx.config)) {
        console.log('dialect not found in config, default patched')
        ctx.config.dialect = 'mysql'
    }
    if (!('dbEncryptionMode' in ctx.config)) {
        console.log('dbEncryptionMode not found in config, default patched')
        ctx.config.dbEncryptionMode = 'unknown'
    }

    ctx._variableCount = 1
}

const handleDefaults = ctx => {

    if (!ctx?.config && ('TABLE_NAME' in ctx) && ('POOL' in ctx)) return { success: false, error: `[UnSQL Version Conflict]: '${ctx?.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }

    // handle if connection object is missing
    if (!ctx?.config?.pool && !ctx?.config?.connection) return { success: false, error: `Please provide mysql connection or connection pool inside config (static property) of '${ctx?.name}' model class` }

    // handle if table name is missing
    if (!ctx?.config?.table) return { success: false, error: `[Required]: Missing 'table' name inside 'config' of '${ctx?.name}' model class` }

    return { success: true }
}

const prepJsonbUpdate = (col, value, isUpdate) => isUpdate ? `${col}::jsonb || '${JSON.stringify(value)}'::jsonb` : `'${JSON.stringify(value)}'::jsonb`

/**
 * @class
 * @description provides various lifecycle methods to manage re-usable MySQL session (transactions)
 * @alias SessionManager
 * 
 * @returns {Promise<{success: boolean, error?: string, message?: string}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'message'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class SessionManager {

    /**
     * @constructor
     * @param {*} pool MySQL connection pool or connection object or PostgreSQL pool object
     * @param {'mysql'|'postgresql'} [dialect='mysql'] 
     */
    constructor(pool, dialect = 'mysql') {
        this.pool = pool
        this.dialect = dialect
    }

    /**
     * @async
     * @method init
     * @description initiates transaction
     * @returns {Promise<void|{success: false, error?: *}|{success: true, message: string}>}
     * @memberof SessionManager
     */
    async init() {
        switch (this?.dialect) {
            case 'mysql':
                this.conn = await this?.pool?.getConnection() || this?.pool
                await this?.conn?.beginTransaction()
                break
            case 'postgresql':
                this.conn = await this?.pool?.connect()
                await this?.conn?.query('BEGIN')
                break
            default:
                return { success: false, error: 'Invalid dialect provided in config' }
        }
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
        if (this.dialect === 'mysql') await this?.conn?.rollback()
        else if (this.dialect === 'postgresql') await this?.conn?.query('ROLLBACK')
        if (close) await this.close()
    }

    /**
     * @async
     * @method commit
     * @description commits the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void|{success: false, error: string}>}
     * @memberof SessionManager
     */
    async commit(close = true) {
        try {
            if (this.dialect === 'mysql') await this.conn.commit()
            else if (this.dialect === 'postgresql') await this.conn.query('COMMIT')
        } catch (error) {
            await this.rollback()
            return { success: false, error }
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