const { colors, handleError, handleQueryDebug } = require("./helpers/console.helper")
const { prepareJoin } = require("./helpers/join.helper")
const { prepareOrders } = require("./helpers/order.helper")
const { patchInline, patchToArray } = require("./helpers/patch.helper")
const { prepareSelect } = require("./helpers/select.helper")
const { prepareWhere } = require("./helpers/where.helper")

class UnSQL {

    static config = {
        connection: null,
        pool: null,
        table: null,
        strictMode: false
    }

    static schema = null

    constructor() {
        console.dir(this.constructor)
    }

    static async find({ alias = null, select = [], join = [], where = {}, junction = 'and', windows = [], groupBy = null, having = null, orderBy = [], rowCount = null, offset = null, debug = false }) {

        if (!this?.config?.pool && !this?.config?.connection) {
            console.log(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide mysql connection or connection pool inside config (static property) of ' + this.name + ' model class' }
        }

        if (!this?.config?.table) {
            console.error(colors.red, 'Please provide database table name inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
        }

        let sql = 'SELECT '

        const values = []

        try {
            // console.log('inside if block')
            const selectResp = prepareSelect({ alias, select })
            // console.log('selectResp', selectResp)
            sql += patchInline(selectResp.sql, selectResp.sql)
            patchToArray(values, selectResp.values.length > 0, selectResp.values)


            sql += ' FROM ?? '
            values.push(this.config.table)
            sql += patchInline(alias, '??')
            patchToArray(values, alias, alias)

            if (join.length) {
                const joinResp = prepareJoin({ alias, join })
                // console.log('joinResp', joinResp)
                sql += joinResp.sql
                values.push(...joinResp?.values)
            }

            if (Object.keys(where).length) {
                sql += ' WHERE '
                const whereResp = prepareWhere({ alias, where, junction })
                // console.log('where resp', whereResp)
                sql += whereResp.sql
                values.push(...whereResp?.values)
            }

            if (orderBy.length) {
                sql += ' ORDER BY '
                const orderResp = prepareOrders({ alias, orderBy })
                sql += orderResp.sql
                values.push(...orderResp.values)
            }

            sql += patchInline(parseInt(rowCount), ' LIMIT ? ')
            patchToArray(values, parseInt(rowCount), parseInt(rowCount))

            sql += patchInline(parseInt(offset), 'OFFSET ?')
            patchToArray(values, parseInt(offset), parseInt(offset))


            const conn = await (this?.config?.connection || this?.config?.pool?.getConnection())

            // console.log('conn', conn.connection.database)

            try {
                await conn.beginTransaction()

                const prepared = conn.format(sql, values)

                handleQueryDebug(debug, sql, values, prepared)

                const [rows] = await conn.query(prepared)

                await conn.commit()
                if (debug === true) console.log(colors.green, 'Find query executed successfully!', colors.reset)
                if (debug === true) console.log('\n')
                return { success: true, result: rows }

            } catch (error) {
                handleError(debug, error)
                if (conn) await conn.rollback()
                return { success: false, error }
            } finally {
                if (this.config?.pool) {
                    await conn.release()
                    // console.log('connection released to pool')
                }
            }

        } catch (error) {
            // console.error('error caught by global try catch', error)
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }

    static async save({ data = [] || {}, where = {}, upsert, encrypt = { columns: [] }, debug = false }) {

        if (!this?.config?.pool && !this?.config?.connection) {
            console.error(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide mysql connection or connection pool inside config (static property) of ' + this.name + ' model class' }
        }

        if (!this?.config?.table) {
            console.error(colors.red, 'Please provide database table name inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
        }

        if (Array.isArray(data) && Object.keys(where).length) {
            console.error(colors.red, 'Data argument accepts single json object as value with where clause, array was provided', colors.reset)
            return { success: false, error: 'Data argument accepts single json object as value with where clause, array was provided' }
        }

        const values = []

        let sql = patchInline(where, 'UPDATE ?? ', 'INSERT INTO ?? ')

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

                sql += '(??)'
                values.push(insertColumns)

                const insertValues = []

                // loop over each json object for values
                for (let i = 0; i < data.length; i++) {

                    const rows = []

                    for (let j = 0; j < insertColumns.length; j++) {
                        rows.push(data[i][insertColumns[j]] || null)
                    }

                    insertValues.push(rows)

                }

                // loop for values ended
                values.push(insertValues)
                sql += ' VALUES ? '
                break
            }

            case typeof data === 'object': {
                // extract all columns from data object
                sql += 'SET ? '
                values.push(data)
                break
            }

            default: {
                return { success: false, error: "Invalid data type! Data argument accepts only object or array of objects" }
            }

        }

        if (Object.keys(where).length) {
            sql += 'WHERE '
            const whereResp = prepareWhere({ where })
            sql += whereResp.sql
            values.push(...whereResp.values)
        }

        const conn = await (this?.config?.connection || this?.config?.pool?.getConnection())

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
            if (this.config?.pool) {
                await conn.release()
                // console.log('connection released to pool')
            }
        }


    }

    static delete({ where = null }) {

        if (!this?.config?.pool && !this?.config?.connection) {
            console.error(colors.red, 'Please provide mysql connection or connection pool inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide mysql connection or connection pool inside config (static property) of ' + this.name + ' model class' }
        }

        if (!this?.config?.table) {
            console.error(colors.red, 'Please provide database table name inside config (static property) of', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
        }

        if (!where && (!this?.config?.safeMode || false)) {
            console.error(colors.red, 'Action Denied! Since no where argument is provided inside delete method, this action will wipe out entire table from your database schema', colors.reset)
            return { success: false, error: 'Please provide database table name inside config (static property) of ' + this.name + ' model class' }
        }

    }

}


module.exports = UnSQL