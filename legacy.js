const { patchInline } = require("./helpers/patch.helper")

class UnSQL {

    static async find({ select = '*', alias = null, join = null, where = null, whereOr = null, junction = 'AND', groupBy = null, having = null, orderBy = null, orderDirection = 'DESC', rowCount = null, offset = null }) {

        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = `SELECT ${select} FROM ${this.TABLE_NAME} `

        sql += patchInline(alias != null, ` ${alias} `)

        if (join != null) {
            for (const element of join) {
                // sql += patchInline(checkAnd(element?.type, element?.table, element?.on), ` ${element?.type} JOIN ${element?.table} ON ${element?.on} `)
                sql += patchInline(element?.type && element?.table && element?.on, ` ${element?.type} JOIN ${element?.table} ON ${element?.on} `)
            }
        }

        if (where != null || whereOr != null) {
            sql += ' WHERE '
            sql += patchInline(where, ` (${where && where.map(condition => condition.join(' ')).join(' AND ')}) `)
            sql += patchInline(where && whereOr, ` ${junction || 'AND'} `)
            sql += patchInline(whereOr, ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `)
        }

        sql += patchInline(groupBy != null, ` GROUP BY ${groupBy} `)
        sql += patchInline(having != null, ` HAVING ${having} `)

        sql += patchInline(orderBy != null, ` ORDER BY ${orderBy} `)
        // sql += patchInline(checkAnd(orderBy != null, ['ASC', 'DESC'].includes(orderDirection.toUpperCase())), ` ${orderDirection} `)
        sql += patchInline(orderBy != null && ('ASC' === orderDirection || 'DESC' === orderDirection), ` ${orderDirection} `)


        sql += patchInline(rowCount, ` LIMIT ${rowCount}`)
        sql += patchInline(offset, ` OFFSET ${offset}`)

        const connection = await this.POOL.getConnection()

        try {
            await connection.beginTransaction()

            const [rows] = await connection.query(sql)

            await connection.commit()

            return { success: true, result: rows }

        } catch (error) {
            if (connection) await connection.rollback()
            return { success: false, error }
        } finally {
            if (connection) await connection.release()
        }


    }

    static async save({ alias = null, data, updateObj = null, where = null, whereOr = null, junction = 'AND' }) {

        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = ''

        if (where != null || whereOr != null) {
            sql = `UPDATE ${this.TABLE_NAME + patchInline(alias != null, ' ' + alias)} SET ? WHERE`
            sql += patchInline(where, ` (${where && where.map(condition => condition.join(' ')).join(' AND ')})`)
            // sql += patchInline(checkAnd(where, whereOr), ` ${junction || 'AND'} `)
            sql += patchInline(where && whereOr, ` ${junction || 'AND'} `)
            sql += patchInline(whereOr, ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `)
        } else {
            sql = `INSERT INTO ${this.TABLE_NAME + patchInline(alias != null, ' ' + alias)} SET ? `

            sql += patchInline(updateObj != null, ' ON DUPLICATE KEY UPDATE ? ')
            if (updateObj != null) data = [data, updateObj]

        }

        try {
            const connection = await this.POOL.getConnection()

            await connection.beginTransaction()

            try {
                const [result] = await connection.query(sql, data)

                await connection.commit()
                return { success: true, insertID: result.insertId }
            } catch (error) {
                if (connection) await connection.rollback()
                return { success: false, error }
            } finally {
                if (connection) await connection.release()
            }


        } catch (error) {
            return { success: false, error }
        }

    }

    static async del({ alias = null, where = null, whereOr = null, junction = 'AND' }) {
        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = `DELETE FROM ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} `


        if (where != null || whereOr != null) {
            sql += ' WHERE '
            sql += patchInline(where, ` (${where && where.map(condition => condition.join(' ')).join(' AND ')}) `)
            sql += patchInline(where && whereOr, ` ${junction || 'AND'} `)
            sql += patchInline(whereOr, ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `)
        }

        const connection = await this.POOL.getConnection()

        try {

            await connection.beginTransaction()

            const result = await connection.query(sql)

            await connection.commit()

            return { success: true, result }
        } catch (error) {
            if (connection) await connection.rollback()
            return { success: false, error }
        } finally {
            if (connection) await connection.release()
        }

    }

}

exports = module.exports = UnSQL