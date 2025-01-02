// @ts-check
const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { prepareJoin } = require("./helpers/join.helper")
const { prepareOrders } = require("./helpers/order.helper")
const { patchInline, patchToArray } = require("./helpers/patch.helper")
const { prepareSelect } = require("./helpers/select.helper")
const { prepareWhere } = require("./helpers/where.helper")
// @ts-ignore
const { findObject, saveObject, saveObject2, deleteObject, config } = require('./defs/types.def')


/**
 * UnSQL is JavaScript based library to interact with structured databases (MySQL). It provides clean and easy interface for interaction for faster and smooth developers' experience.
 * @class UnSQL
 * @alias UnSQL
 * @classdesc All model classes shall extend using UnSQL base class to access advanced functionalities
 * @namespace UnSQL
 * 
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class UnSQL {


    /**
     * config is a static property object, used to declare configurations relating to a model class
     * @type {config} (required) accepts configurations related to model class as its properties
     * @static
     * @public
     * @memberof UnSQL
     */
    // @ts-ignore
    static config = {}

    /**
     * @prop {object} [schema] (optional) this is used to declare the structure of table in database
     * 
     * @static
     */
    static schema = null

    constructor() {
        console.dir(this.constructor)
    }


    /**
     * Find method
     * @method find
     * @description find method is used to fetch records from the database table
     * 
     * @static
     * @param {findObject} findObject takes in various parameters that governs different query conditions and values
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     * @memberof UnSQL
     */
    // @ts-ignore
    static async find({ alias = null, select = [], join = [], where = {}, junction = 'and', windows = [], groupBy = [], having = null, orderBy = [], limit = null, offset = null, encryption = {}, debug = false } = {}) {

        // handle if connection object is missing
        if (!this?.config?.pool && !this?.config?.connection) {
            console.log(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
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
        // let sql = 'SELECT '


        // try {
        // console.log('inside if block')
        
        const selectResp = prepareSelect({ alias, select, encryption, ctx: this })
        // console.log('selectResp', selectResp)
        sql += patchInline(selectResp.sql, selectResp.sql)
        patchToArray(values, selectResp.values.length > 0, selectResp.values)


        sql += ' FROM ?? '
        values.push(this.config.table)
        sql += patchInline(alias, '?? ')
        patchToArray(values, alias, alias)

        if (join.length) {
            // @ts-ignore
            const joinResp = prepareJoin({ alias, join, ctx: this })
            // console.log('joinResp', joinResp)
            sql += joinResp.sql
            values.push(...joinResp?.values)
        }

        if (Object.keys(where).length) {
            sql += 'WHERE '
            // @ts-ignore
            const whereResp = prepareWhere({ alias, where, junction, ctx: this })
            // console.log('where resp', whereResp)
            sql += whereResp.sql
            values.push(...whereResp?.values)
        }

        if (groupBy.length) {
            sql += 'GROUP BY '
            sql += groupBy.map(gb => {
                values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
                return '??'
            }).join(', ')
        }

        if (orderBy.length) {
            sql += ' ORDER BY '
            const orderResp = prepareOrders({ alias, orderBy })
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

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [rows] = await conn.query(prepared)

            await conn.commit()
            if (debug === true) console.log(colors.green, 'Find query executed successfully!', colors.reset)
            if (debug === true) console.log('\n')
            return { success: true, result: (encryption?.mode || this?.config?.encryption?.mode ? rows[1] : rows) }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
                // console.log('connection released to pool')
            }
        }

        // } catch (error) {
        //     // console.error('error caught by global try catch', error)
        //     return { success: false, error: error.sqlMessage || error.message || error }
        // }
    }


    /**
     * @method save 
     * @description save method used in insert / update / upsert record(s) in the database table
     * 
     * @static
     * @param {saveObject} saveObject
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     * @memberof UnSQL
     */
    // @ts-ignore
    static async save({ data = [], where = {}, upsert = {}, encrypt = {}, encryption = {}, debug = false }) {

        const whereLength = Object.keys(where).length || 0

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

            // handle if data is array and where clause is also provided
            // @ts-ignore
            case (Array.isArray(data) && whereLength): {
                console.error(colors.red, 'Data argument accepts single json object as value with where clause, array was provided', colors.reset)
                return { success: false, error: 'Data argument accepts single json object as value with where clause, array was provided' }
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

        sql += patchInline(whereLength, 'UPDATE ?? ', 'INSERT INTO ?? ')

        values.push(this.config.table)

        switch (true) {

            // handle if data is array of json object(s)
            case Array.isArray(data): {

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
                        // rows.push(patchInline(encrypt.columns.includes(insertColumns[j]) && !!data[i][insertColumns[j]], 'AES_ENCRYPT(') + '?' + patchInline(encrypt.columns.includes(insertColumns[j]) && !!data[i][insertColumns[j]], `, UNHEX(SHA2(?, ${this.config.encryption.sha})))`))

                        let rowSql = ''

                        if (!data[i][insertColumns[j]] || data[i][insertColumns[j]] === 'null' || !encrypt[insertColumns[j]]) {
                            console.log(colors.bgGreen + `inside if block of save2 ${data[i][insertColumns[j]]} value` + colors.reset)
                            rowSql += '?'
                            values.push(data[i][insertColumns[j]] || null)
                            rows.push(rowSql)
                            continue
                        }
                        console.log(colors.bgRed + `outside if block ${data[i][insertColumns[j]]} value` + colors.reset)
                        rowSql += 'AES_ENCRYPT(?'
                        values.push(data[i][insertColumns[j]] || null)

                        // handle if local query encryption mode is set
                        if (encryption?.mode && (encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)) {

                            rowSql += patchInline(encryption?.mode?.includes('-cbc'), ', ?')
                            rowSql += ', UNHEX(SHA2(?, ?))'

                            values.push(encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            // check if encryption mode requires iv or sha
                            if (encryption?.mode?.includes('-cbc')) {
                                values.push(encrypt[insertColumns[j]]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }
                            values.push(encrypt[insertColumns[j]]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        }
                        // handle if global encryption mode is set
                        else if (this?.config?.encryption?.mode && (encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)) {

                            rowSql += patchInline(this?.config?.encryption?.mode?.includes('-cbc'), ', ?')

                            rowSql += ', UNHEX(SHA2(?, ?))'

                            values.push(encrypt[insertColumns[j]]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            // check if encryption mode requires iv or sha
                            if (this?.config?.encryption?.mode?.includes('-cbc')) {
                                values.push(encrypt[insertColumns[j]]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }

                            values.push(encrypt[insertColumns[j]]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        }

                        rowSql += ')'

                        rows.push(rowSql)

                    }

                    // this was pushing values to insertValues
                    if (i != 0) sql += ', '
                    sql += `(${rows.join(', ')})`

                }

                // loop for values ended
                values.push(...insertValues)
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

                        // handle if local query encryption mode is set
                        if (encryption?.mode && (encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)) {

                            rowSql += patchInline(encryption?.mode?.includes('-cbc'), ', ?')

                            rowSql += ', UNHEX(SHA2(?, ?))'

                            values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            // check if encryption mode requires iv or sha
                            if (encryption?.mode?.includes('-cbc')) {
                                values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }

                            values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        }
                        // handle if global encryption mode is set
                        else if (this?.config?.encryption?.mode && (encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)) {

                            rowSql += patchInline(this?.config?.encryption?.mode?.includes('-cbc'), ', ?')

                            rowSql += ', UNHEX(SHA2(?, ?))'

                            values.push(encrypt[col]?.secret || encryption?.secret || this?.config?.encryption?.secret)

                            // check if encryption mode requires iv or sha
                            if (this?.config?.encryption?.mode?.includes('-cbc')) {
                                values.push(encrypt[col]?.iv || encryption?.iv || this?.config?.encryption?.iv)
                            }

                            values.push(encrypt[col]?.sha || encryption?.sha || this?.config?.encryption?.sha || 512)

                        }

                        rowSql += ')'

                    } else {
                        rowSql += '?'
                        values.push(val)
                    }

                    return rowSql
                }).join(', ')
                values.push(data)
                break
            }

            default: {
                return { success: false, error: "Invalid data type! Data argument accepts only object or array of objects" }
            }

        }

        if (whereLength) {
            sql += 'WHERE '
            // @ts-ignore
            const whereResp = prepareWhere({ where, ctx: this })
            sql += whereResp.sql
            values.push(...whereResp.values)
        }

        sql += ';'
        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)

        try {
            await conn.beginTransaction()

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result, row, err] = await conn.query(sql, values)

            await conn.commit()
            return { success: true, ...(encryption?.mode || this?.config?.encryption?.mode ? result[1] : result) }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
                // console.log('connection released to pool')
            }
        }


    }

    /**
     * @method delete
     * @description delete method is used to remove record(s) from the database table
     * @param {deleteObject} deleteObject
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} returns Promise that always resolves with two parameters: success and either error or result depending on the condition if query ran successfully or failed
     */
    static async delete({ where = {}, debug = false } = {}) {

        console.log('this inside delete method', this)
        switch (true) {

            // handle if connection object is missing
            case !this?.config?.pool && !this?.config?.connection: {
                console.error(colors.red, 'Please provide mysql connection or connection pool inside config of', this.name, 'model class', colors.reset)
                return { success: false, error: 'Please provide mysql connection or connection pool inside config of ' + this.name + ' model class' }
            }

            // handle if table name is missing
            case !this?.config?.table: {
                console.error(colors.red, 'Please provide database table name inside config of', this.name, 'model class', colors.reset)
                return { success: false, error: 'Please provide database table name inside config of ' + this.name + ' model class' }
            }

            // handle delete all if safe mode is active
            case !Object.keys(where).length && (this?.config?.safeMode || !('safeMode' in this.config)): {
                console.error(colors.red + 'Delete all records from database table in Safe Mode is prohibited!' + colors.reset)
                console.error(colors.yellow + 'Please either disable Safe Mode in the model class config or provide a criteria inside where block to restrict delete action!' + colors.reset)
                return { success: false, error: 'Please disable Safe Mode inside config of ' + this.name + ' model class' }
            }
        }

        let sql = 'DELETE FROM ??'
        const values = []
        values.push(this.config.table)

        if (Object.keys(where).length) {
            sql += ' WHERE '
            // @ts-ignore
            const whereResp = prepareWhere({ where, ctx: this })
            sql += whereResp.sql
            values.push(...whereResp.values)
        }

        const conn = await (this?.config?.pool?.getConnection() || this?.config?.connection)
        // @ts-ignore
        return
        // @ts-ignore
        try {
            await conn.beginTransaction()

            const prepared = conn.format(sql, values)

            handleQueryDebug(debug, sql, values, prepared)

            const [result] = await conn.query(sql, values)

            console.log('result', result)

            await conn.commit()
            return { success: true, ...result }

        } catch (error) {
            handleError(debug, error)
            if (conn) await conn.rollback()
            return { success: false, error }
        } finally {
            if (this?.config?.pool) {
                await conn.release()
                // console.log('connection released to pool')
            }
        }

    }

}


module.exports = UnSQL