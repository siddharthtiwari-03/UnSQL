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
        console.group('UnSQL constructor invoked!')
        console.dir(this.constructor)
        console.groupEnd('UnSQL constructor ends!')
    }

    static async find({ alias = null, select = [], join = [], where = {}, junction = 'and', windows = [], groupBy = null, having = null, orderBy = [], rowCount = null, offset = null, debug = false } = {}) {

        if (!this?.config?.pool && !this?.config?.connection) {
            console.log(colors.red, 'Please provide mysql connection or connection pool inside config for', this.name, 'model class', colors.reset)
            return { success: false, error: 'Please provide mysql "connection" or connection "pool" inside "config" for ' + this.name + ' model class' }
        }

        let sql = 'SELECT '

        const values = []

        try {
            console.log('inside if block')
            const selectResp = prepareSelect({ alias, select })
            console.log('selectResp', selectResp)
            sql += patchInline(selectResp.sql, selectResp.sql)
            patchToArray(values, selectResp.values.length > 0, selectResp.values)


            sql += ' FROM ?? '
            values.push(this.config.table)
            sql += patchInline(alias, '??')
            patchToArray(values, alias, alias)

            if (join.length) {
                const joinResp = prepareJoin({ alias, join })
                console.log('joinResp', joinResp)
                sql += joinResp.sql
                values.push(...joinResp?.values)
            }

            if (Object.keys(where).length) {
                sql += ' WHERE '
                const whereResp = prepareWhere({ alias, where, junction })
                console.log('where resp', whereResp)
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

            console.log('conn', conn.connection.database)

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
                    console.log('connection released to pool')
                }
            }

        } catch (error) {
            console.error('error caught by global try catch', error)
            return { success: false, error: error.sqlMessage || error.message || error }
        }
    }

    static save({ }) {

    }

    static delete({ }) {

    }

}


module.exports = UnSQL