const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { prepSelect, prepWhere, prepJoin, prepOrderBy, patchGroupBy, patchLimit, prepEncryption, isVariable, prepRefer, hasKeys } = require("./helpers/main.helper")
const path = require('node:path')
const fs = require('node:fs/promises')

/**
 * JavaScript ORM for structured databases (MySQL, PostgreSQL, SQLite)
 * Extend this class to access clean, structured database interaction interface
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class UnSQL {

    /**
     * config is a static property object, used to declare configurations relating to a model class
     * @type {import("./defs/types").ConfigObject} (required) defines configurations for this model class
     */
    static config = {
        table: '',
        safeMode: true,
        devMode: false,
        dialect: 'mysql',
        pool: undefined
    }

    /**
     * Fetches records from the database table based on provided criteria.
     * @param {Object} [findParam={}] - Configuration for the find operation.
     * @param {string} [findParam.alias] - Local reference name for table mapped to this model.
     * @param {import("./defs/types").SelectObject} [findParam.select=[]] - Columns to extract; accepts arrays, column names, or wrapper methods.
     * @param {import("./defs/types").JoinObject} [findParam.join=[]] - Association of child table(s) to this model.
     * @param {import("./defs/types").WhereObject} [findParam.where={}] - Filter conditions for the query.
     * @param {string[]} [findParam.groupBy=[]] - Column(s) to group records by.
     * @param {import("./defs/types").HavingObject} [findParam.having={}] - Filter using aggregate methods.
     * @param {Object<string, 'asc'|'desc'>} [findParam.orderBy={}] - Sort order for the results.
     * @param {number} [findParam.limit] - Maximum number of records to fetch.
     * @param {number} [findParam.offset] - Starting index for pagination.
     * @param {import("./defs/types").EncryptionConfig} [findParam.encryption={}] - Query-level encryption settings.
     * @param {import("./defs/types").DebugTypes} [findParam.debug=false] - Debug mode configuration.
     * @param {SessionManager} [findParam.session] - Database session/transaction manager.
     * @returns {Promise<{success: boolean, error?: any, result?: any[]|any, meta?: any}>} 
     * Resolves with the execution status and the resulting dataset or error.
     * @example
     * const { success, result } = await User.find({ 
     * where: { status: true, role: '#admin' }, 
     * limit: 10, 
     * debug: 'query', 
     * });
     */
    static async find({ alias = undefined, select = [], join = [], where = {}, groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encryption = {}, debug = false, session = undefined } = {}) {
        patchDefaults(this)

        const { dialect } = this.config
        const ctx = {
            table: this.config.table,
            dialect,
            isMySQL: dialect === 'mysql',
            isPostgreSQL: dialect === 'postgresql',
            isSQLite: dialect === 'sqlite',
            _variableCount: 1,
            config: this.config
        }

        const defaultResp = handleDefaults(this)
        if (!defaultResp?.success) return defaultResp

        /** @type {Array<*>} */
        const values = []
        const sqlParts = []

        try {
            sqlParts.push(`SELECT ${prepSelect({ alias, select, values, encryption, ctx })} FROM ${ctx.isMySQL ? '??' : `"${ctx.config?.table}"`}`)
            if (ctx.isMySQL) values.push(ctx.config?.table)
            if (alias) {
                if (ctx.isMySQL) values.push(alias)
                sqlParts.push(ctx.isMySQL ? '??' : `"${alias}"`)
            }
            if (join.length) sqlParts.push(prepJoin({ alias, join, values, encryption, ctx }))
            if (hasKeys(where)) sqlParts.push(`WHERE ${prepWhere({ alias, where, values, encryption, ctx })}`)
            if (groupBy.length) sqlParts.push(patchGroupBy({ groupBy, alias, values, ctx }))
            if (hasKeys(having)) sqlParts.push(`HAVING ${prepWhere({ alias, where: having, values, encryption, ctx })}`)
            if (hasKeys(orderBy)) sqlParts.push(prepOrderBy({ alias, orderBy, values, ctx }))
            if (typeof limit === 'number') sqlParts.push(patchLimit(limit, values, ctx))
            if (typeof offset === 'number') sqlParts.push(patchLimit(offset, values, ctx, 'OFFSET'))

            const debugMessage = 'Fetched records in'
            return await handleExecutions[ctx.config?.dialect || 'mysql']({ sql: sqlParts.join(' '), values, encryption, debug, session, config: ctx.config, debugMessage, methodType: 'all' })

        } catch (/** @type {*} */ error) {
            handleError(debug, error)
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }

    /**
     * Insert update or upsert data into database
     * @param {Object} saveParam
     * @param {string?} [saveParam.alias]
     * @param {Record<string, any>|any[]} saveParam.data
     * @param {import("./defs/types").WhereObject} saveParam.where
     * @param {any[]} [saveParam.upsert]
     * @param {string[]} [saveParam.indexes]
     * @param {any} [saveParam.encrypt]
     * @param {import("./defs/types").DebugTypes} [saveParam.debug]
     * @param {import("./defs/types").EncryptionConfig} [saveParam.encryption]
     * @param {SessionManager} [saveParam.session]
     * @returns {Promise<{success:boolean, error?:*, result?:Array<*>|{insertId?:number, changes?:number}}>}
     */
    static async save({ alias = null, data, where = {}, upsert = [], indexes = [], encrypt, encryption, debug, session }) {

        if (!data || data instanceof Date || typeof data != 'object') return { success: false, error: `Invalid value in 'data' argument! Can only be valid Javascript object or an array of objects` }

        patchDefaults(this)

        const { dialect } = this.config
        const ctx = {
            table: this.config.table,
            dialect,
            isMySQL: dialect === 'mysql',
            isPostgreSQL: dialect === 'postgresql',
            isSQLite: dialect === 'sqlite',
            _variableCount: 1,
            config: this.config
        }

        // ↓ added — mirrors find/delete/save
        const defaultResp = handleDefaults(ctx)
        if (!defaultResp.success) return defaultResp

        // ↓ added — SQLite encryption guard
        if (hasKeys(encrypt) && ctx.isSQLite) return { success: false, error: `[Unsupported]: Column-level encryption is not supported in SQLite. Encrypt values at application level before passing to save2.` }

        const sqlParts = []
        const values = []
        const isUpdate = hasKeys(where)
        const isUpsert = upsert.length > 0

        if (isUpdate && isUpsert) return { success: false, error: `Invalid combination! Data can either be updated using 'where' clause or upsert using 'upsert' argument` }

        if (isUpsert && !ctx.isMySQL && !indexes.length) return { success: false, error: `Invalid combination! 'index' argument is required with 'upsert' in '${ctx.dialect}'` }

        if (!isUpdate && !Array.isArray(data)) data = [data]

        sqlParts.push(`${isUpdate ? `UPDATE` : `INSERT INTO`} ${ctx.isMySQL ? `??` : `"${this.config.table}"`}`)
        if (ctx.isMySQL) values.push(this.config.table)

        if (alias && isUpdate) {
            if (ctx.isMySQL) values.push(alias)
            sqlParts.push(ctx.isMySQL ? '??' : `"${alias}"`)
        }

        // extract columns from first row
        const columns = Array.isArray(data) ? Object.keys(data[0]) : Object.keys(data)
        const totalColumns = columns.length
        try {

            if (Array.isArray(data)) {
                const dataLength = data.length

                if (!dataLength) return { success: false, error: `Empty 'data' argument detected!` }

                if (dataLength > 1 && isUpdate) return { success: false, error: `Invalid combination! Multiple values in 'data' argument passed with 'where' clause` }

                if (data.some(val => !val || typeof val != 'object')) return { success: false, error: `Invalid values in 'data' argument!` }

                const colPlaceholders = new Array(totalColumns)

                for (let i = 0; i < totalColumns; i++) {
                    const col = columns[i]
                    colPlaceholders[i] = ctx.isMySQL ? '??' : `"${col}"`
                    if (ctx.isMySQL) values.push(col)
                }

                // prepare the column placeholders
                sqlParts.push(`(${colPlaceholders.join(', ')}) VALUES`)

                const valRows = new Array(dataLength)

                // loop over data to prepare value rows
                for (let i = 0; i < dataLength; i++) {
                    const record = data[i]
                    const rowParts = new Array(totalColumns)
                    for (let j = 0; j < totalColumns; j++) {
                        const col = columns[j]
                        const val = record[col]

                        if (encrypt?.[col]) {
                            const placeholder = ctx.isMySQL ? '?' : `$${ctx._variableCount++}`
                            values.push(val)
                            rowParts[j] = prepEncryption({ placeholder, col, encrypt, values, encryption, ctx })
                            continue
                        }

                        rowParts[j] = ctx.isMySQL ? '?' : `$${ctx._variableCount++}`
                        if (val == null) values.push(null)
                        else if (typeof val == 'object' && !(val instanceof Date)) values.push(ctx.isPostgreSQL ? val : JSON.stringify(val))
                        else values.push(val)
                    }
                    valRows[i] = `(${rowParts.join(', ')})`
                }
                sqlParts.push(valRows.join(', '))

            } else if (typeof data == 'object') {
                const setEntries = new Array(totalColumns)

                for (let i = 0; i < totalColumns; i++) {
                    const col = columns[i]
                    const val = data[col]
                    const isJson = val != null && typeof val == 'object' && !(val instanceof Date)

                    if (encrypt?.[col]) {
                        const placeholder = ctx.isMySQL ? '?' : `$${ctx._variableCount++}`
                        if (ctx.isMySQL) values.push(col)
                        if (val == null) values.push(null)
                        else if (isJson) values.push(ctx.isPostgreSQL ? val : JSON.stringify(val))
                        else values.push(val)
                        setEntries[i] = `${ctx.isMySQL ? '?? = ' : `"${col}" = `}${prepEncryption({ placeholder, col, values, encrypt, encryption, ctx })}`
                        continue
                    }

                    setEntries[i] = ctx.isMySQL ? '?? = ?' : `"${col}" = ${isUpdate && isJson && ctx.isPostgreSQL ? `"${col}" || ` : ''}$${ctx._variableCount++}${ctx.isPostgreSQL && isJson ? '::jsonb' : ''}`

                    if (ctx.isMySQL) values.push(col)
                    if (val == null) values.push(null)
                    else if (isJson) values.push(ctx.isPostgreSQL ? val : JSON.stringify(val))
                    else values.push(val)

                }
                sqlParts.push(`SET ${setEntries.join(', ')}`)
            }


            if (isUpdate) sqlParts.push(`WHERE ${prepWhere({ alias, where, values, ctx })}`)

            if (isUpsert) {

                const upsertColumns = upsert.length

                const upsertParts = []

                const firstRow = Array.isArray(data) ? data[0] : data

                /** @type {Record<string, string>} */
                const opsMap = { add: '+', sub: '-', mul: '*', mod: '%', div: '/' }

                for (let i = 0; i < upsertColumns; i++) {
                    const entry = upsert[i]

                    if (typeof entry == 'string' && entry.startsWith('#')) return { success: false, error: `Invalid column name! String starting with '#' is recognized by UnSQL as string value not column name` }
                    else if (entry == null || entry instanceof Date || Array.isArray(entry)) return { success: false, error: `Invalid entry in upsert! ${entry} not valid upsert` }

                    if (typeof entry == 'string' && entry in firstRow) {
                        if (encrypt?.[entry]) {
                            const placeholder = ctx.isMySQL ? 'EXCLUDED.??' : `EXCLUDED."${entry}"`
                            if (ctx.isMySQL) values.push(entry, entry)
                            const encryptedExcluded = prepEncryption({ placeholder, col: entry, encrypt, encryption, values, ctx })
                            upsertParts.push(`${ctx.isMySQL ? '?? = ' : `"${entry}" = `}${encryptedExcluded}`)
                            continue
                        }
                        upsertParts.push(ctx.isMySQL ? '?? = EXCLUDED.??' : `"${entry}" = EXCLUDED."${entry}"`)
                        if (ctx.isMySQL) values.push(entry, entry)
                        continue
                    }

                    if (typeof entry == 'object') {
                        const keys = Object.keys(entry)
                        if (keys.length > 1) return { success: false, error: `Upsert object entry must have exactly one column key, found: ${keys.join(', ')}` }
                        const col = keys[0]
                        const valueObj = entry[col]

                        const baseStr = ctx.isMySQL ? `?? = ` : `"${col}" = `
                        if (ctx.isMySQL) values.push(col)

                        if ('refer' in valueObj) {
                            upsertParts.push(baseStr + prepRefer({ val: valueObj.refer, values, ctx }))
                        } else {
                            let expr = ctx.isMySQL ? '??' : `"${col}"`
                            if (ctx.isMySQL) values.push(col)

                            for (const key in valueObj) {

                                if (key in opsMap) {

                                    const op = opsMap[key]

                                    const newVal = valueObj[key]

                                    if (newVal && typeof newVal == 'object' && 'refer' in newVal) {
                                        expr += ` ${op} ${prepRefer({ val: newVal.refer, values, ctx, encryption })}`
                                    } else {
                                        expr += ` ${op} ${ctx.isMySQL ? `?` : `$${ctx._variableCount++}`}`
                                        values.push(newVal)
                                    }
                                }

                            }

                            upsertParts.push(baseStr + expr)

                        }

                    }

                }

                if (upsertParts.length > 0) sqlParts.push(ctx.isMySQL ? `AS EXCLUDED ON DUPLICATE KEY UPDATE` : `ON CONFLICT (${indexes.join(', ')}) DO UPDATE SET`, upsertParts.join(', '))

            }

            const debugMessage = `${isUpdate ? 'Updated' : 'Inserted'} records in`
            return await handleExecutions[ctx.dialect || 'mysql']({ sql: sqlParts.join(' '), values, config: ctx.config, debug, debugMessage, encryption, methodType: 'run', session })
        } catch (error) {
            console.error('error while save2', error)
            return { success: false, error }
        }

    }


    /**
     * delete method is used to remove record(s) from the database table
     * @param {Object} deleteParam delete query object definition
     * @param {string} [deleteParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").WhereObject} [deleteParam.where] (optional) filter record(s) to be updated
     * @param {import("./defs/types").EncryptionConfig} [deleteParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [deleteParam.debug] (optional) enables various debug mode
     * @param {SessionManager} [deleteParam.session] (optional) global session reference for transactions and rollback
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static async delete({ alias = undefined, where = {}, debug = false, encryption = undefined, session = undefined } = {}) {

        patchDefaults(this)

        const { dialect } = this.config
        const ctx = {
            table: this.config.table,
            name: this.name,
            dialect,
            isMySQL: dialect === 'mysql',
            isPostgreSQL: dialect === 'postgresql',
            isSQLite: dialect === 'sqlite',
            _variableCount: 1,
            config: this.config
        }

        const defaultResp = handleDefaults(ctx)
        if (!defaultResp.success) return defaultResp

        // handle delete all if safe mode is active
        if (!Object.keys(where).length && ctx.config?.safeMode) {
            console.error(colors.red + `Delete all records from database table in 'safeMode' is prohibited!` + colors.reset)
            return { success: false, error: `Delete all is disabled in 'safeMode' (default 'true') inside 'config' property of '${ctx.name}' model class` }
        }

        const values = []
        const sqlParts = [`DELETE FROM ${(ctx.isMySQL ? '??' : `"${ctx.config?.table}"`)}`]
        if (ctx.isMySQL) values.push(ctx.config?.table)
        if (alias) {
            if (ctx.isMySQL) values.push(alias)
            sqlParts.push(ctx.isMySQL ? '??' : `"${alias}"`)
        }

        if (Object.keys(where).length) sqlParts.push(`WHERE ${prepWhere({ alias, where, values, encryption, ctx: ctx })}`)

        const debugMessage = `Removed record(s) from '${ctx.config?.table}' table`
        return await handleExecutions[ctx.config?.dialect || 'mysql']({ sql: sqlParts.join(' '), values, encryption, debug, session, config: ctx.config, debugMessage, methodType: 'run' })
    }

    /**
     * rawQuery method is used to execute raw SQL query on the database
     * @param {Object} rawQueryParams
     * @param {string} rawQueryParams.sql (required) SQL query to be executed
     * @param {Array<*>} [rawQueryParams.values] (optional) values to be interpolated in the query
     * @param {import("./defs/types").EncryptionConfig} [rawQueryParams.encryption] (optional) encryption configurations
     * @param {import("./defs/types").DebugTypes} [rawQueryParams.debug] (optional) enables debug mode
     * @param {boolean} [rawQueryParams.multiQuery] (optional) flag if sql contains multiple queries (only in 'mysql'), default is false
     * @param {*} [rawQueryParams.session] (optional) global session reference for transactions and rollback
     * @param {'run'|'all'|'exec'} [rawQueryParams.methodType=all] (optional) used only with 'sqlite'
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static async rawQuery({ sql = '', values = [], debug = false, encryption = undefined, session = undefined, multiQuery = false, methodType = 'all' }) {
        patchDefaults(this)
        const defaultResp = handleDefaults(this)
        if (!defaultResp.success) return defaultResp
        const debugMessage = `Executed raw query in`
        return await handleExecutions[this.config?.dialect || 'mysql']({ sql, values, encryption, debug, session, config: this.config, methodType, multiQuery, debugMessage })
    }

    /**
     * export record(s) from the table
     * @param {Object} exportParam
     * @param {string|UnSQL|*} [exportParam.target] (optional) name of the file dynamically created '.json' file or reference to a valid UnSQL model class, defaults to the table name of exporting model class
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
     * @param {{[column:string]:import("./defs/types").EncryptionConfig}} [exportParam.encrypt] (optional) column(s) to encrypt
     * @param {import("./defs/types").EncryptionConfig} [exportParam.encryption] (optional) set encryption configuration
     * @param {'append'|'override'} [exportParam.mode] (optional) set writing mode
     * @param {import("./defs/types").DebugTypes} [exportParam.debug] (optional) set debug mode
     * @returns {Promise<{success: boolean, message?: string, error?: *}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static async export({ target = this.config?.table, directory = 'exports_unsql', select = ['*'], alias = undefined, join = [], where = {}, groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, encrypt = undefined, encryption = undefined, mode = 'append', debug = false } = {}) {

        patchDefaults(this)
        const { dialect } = this.config
        const ctx = {
            name: this.name,
            table: this.config.table,
            dialect,
            isMySQL: dialect === 'mysql',
            isPostgreSQL: dialect === 'postgresql',
            isSQLite: dialect === 'sqlite',
            _variableCount: 1,
            config: this.config
        }
        const defaultResp = handleDefaults(ctx)
        if (!defaultResp.success) return defaultResp

        if (!ctx.config?.devMode) return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${ctx.name}' model if inside 'config', 'devMode' is set to 'true' (currently '${ctx.config?.devMode}')` }
        if (Object.getPrototypeOf(target) === UnSQL && !target['config']?.devMode) return { success: false, error: `[Action Denied]: Record(s) can only be exported from '${target['name']}' model if inside 'config', 'devMode' is set to 'true' (currently '${target['config']?.devMode}')` }

        const result = await this.find({ alias, select, join, where, groupBy, having, orderBy, limit, offset, debug, encryption })

        if (!result.success) {
            console.error(colors.red, result.error?.sqlMessage || result.error?.message, colors.reset)
            return result
        }

        switch (true) {

            case (Object.getPrototypeOf(target) === UnSQL): { // export to 'model' class
                const cloned = await target['save']({ data: result.result, encrypt, encryption, debug })
                if (!cloned.success) {
                    console.error(colors.red, cloned.error?.sqlMessage || cloned.error?.message, colors.reset)
                    return cloned
                }
                return { success: true, message: `${result?.result?.length} records exported to '${target['name']}' model` }
            }

            case typeof target === 'string': { // export to '.json' file

                const dir = path.join(path.dirname(require.main?.filename || ''), directory)

                await fs.mkdir(dir, { recursive: true })

                if (mode === 'override')
                    await fs.writeFile(path.join(dir, `${target}.json`), JSON.stringify(result.result))
                else
                    await fs.appendFile(path.join(dir, `${target}.json`), JSON.stringify(result.result))

                return { success: true, message: `${result?.result?.length} records exported from '${ctx.name}' model into '${directory}/${target}.json' file` }
            }

            default:
                return { success: false, error: "Invalid Input! 'target' property can either be 'string' or a valid UnSQL model class" }
        }

    }

    /**
     * Will reset the database table to initial state
     * @param {Object} resetParam
     * @param {import("./defs/types").DebugTypes} [resetParam.debug] (optional) set debug mode
     * @returns {Promise<{success:boolean, message?:string, result?:*, error?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static async reset({ debug = false } = {}) {

        patchDefaults(this)
        const { dialect } = this.config
        const ctx = {
            table: this.config.table,
            dialect,
            isMySQL: dialect === 'mysql',
            isPostgreSQL: dialect === 'postgresql',
            isSQLite: dialect === 'sqlite',
            _variableCount: 1,
            config: this.config
        }

        const defaultResp = handleDefaults(ctx)

        if (!defaultResp.success) return defaultResp

        const sql = `TRUNCATE ${ctx.isMySQL ? '??' : `"${ctx.config?.table}"`}`
        const values = []

        if (ctx.isMySQL) values.push(ctx.config.table)

        const debugMessage = `Reset '${ctx.config?.table}' table record(s) in`
        return await handleExecutions[ctx.config?.dialect || 'mysql']({ sql, values, debug, config: ctx.config, debugMessage })
    }

}

/** executes MySQL query
 * @param {Object} options
 * @param {string} options.sql SQL query to be executed
 * @param {Array<any>} options.values values to be interpolated in the query
 * @param {import("./defs/types").DebugTypes} [options.debug] enables debug mode
 * @param {*} [options.session] global session reference for transactions and rollback
 * @param {import("./defs/types").ConfigObject} [options.config] global configuration object
 * @param {string} [options.debugMessage] debug message to be displayed in console
 * @param {boolean} [options.multiQuery] flag if sql contains multiple queries (only in 'mysql'), default is false
 * @param {import("./defs/types").EncryptionConfig} [options.encryption] enables encryption
 * @returns {Promise<{success:false, error:*}|{success:true, result:Array<*>|*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'results'
 */
const executeMySQL = async ({ sql, values, debug = false, session = undefined, config, encryption = undefined, multiQuery = false, debugMessage = '' }) => {
    const connection = await (session?.connection || config?.pool?.getConnection() || config?.connection)
    const isBenchmarking = debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true

    const needsStatement = debug === true || debug === 'sandbox' || debug === 'query' || debug === 'benchmark-query'

    try {

        const statement = needsStatement ? await connection.format(sql, values) : sql

        handleQueryDebug(debug, sql, values, statement)

        if (debug === 'sandbox') return { success: true, result: [{ message: 'UnSQL executed in sandbox mode' }] }

        if (!session) await connection?.beginTransaction()

        const t0 = isBenchmarking ? performance.now() : 0

        const [result] = await connection[multiQuery || !needsStatement ? 'query' : 'execute'](statement, needsStatement ? undefined : values)

        if (!session) await connection?.commit()
        if (isBenchmarking) {
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
            console.log(`${colors.cyan}UnSQL Benchmark (Query Execution + Network Delay):${colors.reset} ${colors.yellow}${performance.now() - t0}ms${colors.reset}`)
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
        }

        return { success: true, result }

    } catch (error) {
        handleError(debug, error)
        if (connection && !session) await connection?.rollback()
        return { success: false, error }
    } finally {
        if (config?.pool && !session) await connection?.release()
    }
}

/**
 * executes PostgreSQL query
 * @param {Object} params
 * @param {string} params.sql 
 * @param {Array<*>} params.values
 * @param {import("./defs/types").DebugTypes} params.debug
 * @param {import("./defs/types").ConfigObject} params.config
 * @param {SessionManager} [params.session]
 * @param {string} [params.debugMessage]
 * @returns {Promise<{success:true, result:Array<*>|*}|{success:false, error:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
const executePostgreSQL = async ({ sql, values, debug = false, config, session = undefined, debugMessage = '' }) => {
    const client = await (session?.connection || config?.pool?.connect())
    const isBenchmarking = debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true

    handleQueryDebug(debug, sql, values)

    if (debug === 'sandbox') return { success: true, result: [{ message: 'UnSQL executed in sandbox mode' }] }

    try {
        if (!session) await client.query('BEGIN')
        const t0 = isBenchmarking ? performance.now() : 0

        const result = await client.query(sql, values)
        if (!session) await client.query('COMMIT')

        if (isBenchmarking) {
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
            console.log(`${colors.cyan}UnSQL Benchmark (Query Execution + Network Delay):${colors.reset} ${colors.yellow}${performance.now() - t0}ms${colors.reset}`)
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
        }

        const payload = []
        const meta = []

        if (Array.isArray(result)) {
            for (let i = 0; i < result.length; i++) {
                const { rows, fields } = result[i]
                if (rows && rows.length) {
                    payload.push(...rows)
                    meta.push(fields)
                } else if (fields && fields.length) {
                    meta.push(fields)
                }
            }
        } else {
            payload.push(...result.rows)
            meta.push(result.fields)
        }
        return { success: true, result: payload }
    }
    catch (/** @type {*} */ error) {
        if (!session) await client.query('ROLLBACK')
        handleError(debug, error)

        return {
            success: false, error: {
                message: error.message,
                code: error.code,
                detail: error.detail,
                constraint: error.constraint,
                table: error.table,
                schema: error.schema,
                column: error.column,
                severity: error.severity,
                stack: error.stack
            }
        }
    } finally {
        if (!session) await client.release()
    }
}

/**
 * executes SQLite query
 * @param {Object} options
 * @param {string} options.sql
 * @param {Array<*>} options.values
 * @param {import("./defs/types").DebugTypes} [options.debug]
 * @param {import("./defs/types").ConfigObject} [options.config]
 * @param {'all'|'run'|'exec'} [options.methodType=all]
 * @param {string} [options.debugMessage]
 * @param {*} [options.session]
 * @returns {Promise<{success:boolean, result?:Array<*>|{insertId?:number, changes?:number}, error?:*}>}
 */
async function executeSqlite({ sql, values, debug = false, config, methodType = 'all', session = undefined, debugMessage = '' }) {
    const db = await (session?.pool || config?.pool)

    handleQueryDebug(debug, sql, values)

    if (debug === 'sandbox') return { success: true, result: [{ message: 'UnSQL executed in sandbox mode' }] }

    const isBenchmarking = debug === 'benchmark' || debug === 'benchmark-query' || debug === 'benchmark-error' || debug === true
    if (typeof db[methodType] != 'function') return { success: false, error: `Invalid method '${methodType}' detected!` }

    try {
        if (!session?.pool) await db.run('BEGIN TRANSACTION')
        const t0 = isBenchmarking ? performance.now() : 0

        const result = await db[methodType](sql, values) // execute query
        if (!session?.pool) await db.run('COMMIT')

        if (isBenchmarking) {
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
            console.log(`${colors.cyan}UnSQL Benchmark (Query Execution + Network Delay):${colors.reset} ${colors.yellow}${performance.now() - t0}ms${colors.reset}`)
            console.info(`\n${colors.blue}******************************************************************${colors.reset}\n`)
        }

        if (methodType === 'all') return { success: true, result }

        return {
            success: true,
            result: {
                ...('lastID' in result && { insertId: result.lastID }),
                ...('changes' in result && { changes: result.changes })
            }
        }
    } catch (/** @type {*} */ error) {
        if (!session?.pool) await db.run('ROLLBACK')
        const code = error.message?.split(':')[0].trim()
        handleError(debug, error)
        return { success: false, error: { message: error.message, code, stack: error.stack } }
    }
}

/**
 * patch defaults to config context
 * @param {object} ctx - The model class (or object) instance to patch defaults onto.
 * @param {import("./defs/types").ConfigObject} ctx.config - The config object to be patched.
 * @param {number} [ctx._variableCount] - Internal variable count (will be set to 1).
 * @param {boolean} [ctx.isMySQL] - Flag indicating MySQL dialect.
 * @param {boolean} [ctx.isPostgreSQL] - Flag indicating PostgreSQL dialect.
 * @param {boolean} [ctx.isSQLite] - Flag indicating SQLite dialect.
 * @returns {void}
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
const patchDefaults = ctx => {
    if (!('devMode' in ctx.config)) ctx.config.devMode = false
    if (!('safeMode' in ctx.config)) ctx.config.safeMode = true
    if (!('dialect' in ctx.config)) ctx.config.dialect = 'mysql'
    if (!('dbEncryptionMode' in ctx.config)) ctx.config.dbEncryptionMode = 'unknown'
    ctx._variableCount = 1
    ctx.isMySQL = ctx?.config?.dialect === 'mysql'
    ctx.isPostgreSQL = ctx?.config?.dialect === 'postgresql'
    ctx.isSQLite = ctx?.config?.dialect === 'sqlite'
}

/**
 * @param {*} ctx 
 * @returns {{success:true}|{success:false, error:string}}
 */
const handleDefaults = ctx => {
    if (!ctx?.config && ('TABLE_NAME' in ctx) && ('POOL' in ctx)) return { success: false, error: `[UnSQL Version Conflict]: '${ctx?.name}' model class is using 'v1.x' class configuration with 'v2.x' to continue with 'v1.x' kindly switch the 'unsql' import to 'unsql/legacy'` }
    // handle if connection object is missing
    if (!ctx?.config?.pool && !ctx?.config?.connection) return { success: false, error: `[Missing]: Please provide${ctx?.isMySQL ? ` 'connection' or` : ''} 'pool' inside config(static property) of '${ctx?.name}' model class` }
    // handle if table name is missing
    if (!ctx?.config?.table) return { success: false, error: `[Required]: Missing 'table' name inside 'config' of '${ctx?.name}' model class` }
    return { success: true }
}

const handleExecutions = {
    mysql: executeMySQL,
    postgresql: executePostgreSQL,
    sqlite: executeSqlite
}

/**
 * provides various lifecycle methods to manage re-usable MySQL session (transactions)
 * @returns {Promise<{success: boolean, error?: string, message?: string}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'message'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class SessionManager {

    /**
     * @param {*} pool MySQL connection pool or connection object or PostgreSQL pool object
     * @param {'mysql'|'postgresql'|'sqlite'} [dialect='mysql'] 
     */
    constructor(pool, dialect = 'mysql') {
        this.pool = pool
        this.dialect = dialect
    }

    /**
     * initiates transaction
     * @returns {Promise<void|{success: false, error?: *}|{success: true, message: string}>}
     */
    async init() {
        switch (this.dialect) {
            case 'mysql':
                this.connection = await this.pool?.getConnection() || this.pool
                await this.connection?.beginTransaction()
                break
            case 'postgresql':
                this.connection = await this.pool?.connect()
                await this.connection?.query('BEGIN')
                break
            case 'sqlite':
                this.connection = await this.pool
                await this.connection?.run('BEGIN')
                break
            default:
                return { success: false, error: 'Invalid dialect provided in config' }
        }
        return { success: true, message: 'Transaction initialized successfully!' }
    }

    /**
     * rollbacks the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void>}
     */
    async rollback(close = true) {
        if (this.dialect === 'mysql') await this.connection?.rollback()
        else if (this.dialect === 'postgresql') await this.connection?.query('ROLLBACK')
        else if (this.dialect === 'sqlite') await this.connection?.run('ROLLBACK')
        if (close) await this.close()
    }

    /**
     * commits the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void|{success: false, error: string}>}
     */
    async commit(close = true) {
        try {
            if (this.dialect === 'mysql') await this.connection.commit()
            else if (this.dialect === 'postgresql') await this.connection.query('COMMIT')
            else if (this.dialect === 'sqlite') await this.connection.run('COMMIT')
        } catch (/** @type {*} */ error) {
            await this.rollback()
            return { success: false, error }
        } finally {
            if (close) await this.close()
        }
    }

    /**
     * terminates the session and releases the connection
     * @returns {Promise<void>}
     */
    async close() {
        if (typeof this.connection?.release === 'function') await this.connection?.release()
        delete this.connection
    }
}

module.exports = { UnSQL, SessionManager }