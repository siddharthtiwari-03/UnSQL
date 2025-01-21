/**
 * UnSQL base class
 * @class UnSQL
 * @description All the model classes must extend using this base class
 * 
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
class UnSQL {

    /**
     * Generates 'select' statement
     * @method find
     * @description This method is used to dynamically generate valid SQL 'select' query that is used to read / retrieve records from the database
     * 
     * @param {object} findParam
     * 
     * @param {string} [findParam.select] (optional) comma separated string value of columns, functions that needs to be selected from the database
     * 
     * @param {string} [findParam.alias] (optional) local reference name for the database table
     * 
     * @param {Array<{type:string, table:string, on:string}>} [findParam.join] (optional) array of join object(s), each object representing the association of child table to this table
     * 
     * @param {Array<Array<string|number|boolean>>} [findParam.where] (optional) array of array containing conditions to filter the records from the database, each condition is joined using 'and' clause
     * 
     * @param {Array<Array<string|number|boolean>>} [findParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * 
     * @param {'and'|'or'} [findParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     * 
     * @param {string} [findParam.groupBy] (optional) takes in comma separated string value of column(s) that will be used to group the records together
     * 
     * @param {string} [findParam.having] (optional) takes in comma separated string value of column(s) / aggregate method(s) with comparators to filter records
     * 
     * @param {string} [findParam.orderBy] (optional) takes in comma separated string value of column(s) along with key words 'ASC' or 'DESC', that will be used to reorder the records together
     * 
     * @param {'asc'|'desc'} [findParam.orderDirection] (optional) used to define the order 'ascending' or 'descending' via. keywords 'asc' and 'desc' respectively, used when only one column name is entered in 'orderBy' property
     * 
     * @param {number} [findParam.rowCount] (optional) limits the number of records that will be fetched from the database table
     * 
     * @param {number} [findParam.offset] (optional) defines the starting index for the records to be fetched from the database table
     * 
     * @returns {{ success: boolean, result?: Array, error?: * }} execution success acknowledgement along with either 'result' or 'error' object
     * 
     * @static
     * @memberof UnSQL
     */
    static async find({ select = '*', alias = null, join = null, where = null, whereOr = null, junction = 'AND', groupBy = null, having = null, orderBy = null, orderDirection = 'DESC', rowCount = null, offset = null }) {

        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = `SELECT ${select} FROM ${this.TABLE_NAME} `

        if (alias) sql += `${alias} `

        if (join != null) {
            for (const element of join) {
                if (element?.type && element?.table && element?.on) sql += ` ${element?.type} JOIN ${element?.table} ON ${element?.on} `
            }
        }

        if (where != null || whereOr != null) {
            sql += ' WHERE '
            if (where) sql += ` (${where && where.map(condition => condition.join(' ')).join(' AND ')}) `
            if (where && whereOr) sql += ` ${junction || 'AND'} `
            if (whereOr) sql += ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `
        }

        if (groupBy) sql += ` GROUP BY ${groupBy} `
        if (having) sql += ` HAVING ${having} `

        if (orderBy) sql += ` ORDER BY ${orderBy} `
        if (orderBy != null && ('ASC' === orderDirection || 'DESC' === orderDirection)) sql += ` ${orderDirection} `


        if (rowCount) sql += ` LIMIT ${rowCount}`
        if (offset) sql += ` OFFSET ${offset}`

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

    /**
     * Generates 'insert' and 'update' query
     * @method save
     * @description This method is used to 'insert' or 'update' data into the database table by dynamically generating valid SQL based on the parameters passed
     * 
     * @param {object} saveParam
     * 
     * @param {string} [saveParam.alias] (optional) local reference name for the database table
     * 
     * @param {object} saveParam.data (required) actual data that needs to be 'inserted' or 'updated' into the database table
     * 
     * @param {object} [saveParam.updateObj] (optional) data that needs to be 'upsert' into the database table in case of 'duplicate key' is detected
     * 
     * @param {Array<Array<string|number|boolean>>} [saveParam.where] (optional) array of array containing conditions to filter the record in the database that needs to be 'updated', each condition is joined using 'and' clause 
     * 
     * @param {Array<Array<string|number|boolean>>} [saveParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * 
     * @param {'and'|'or'} [saveParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     * 
     * @returns {{success: boolean, insertID?: number, error?: object }} execution success acknowledgement along with either 'insertID' (inserted index) or 'error' object
     * 
     * @static
     * @memberof UnSQL
     */
    static async save({ alias = null, data, updateObj = null, where = null, whereOr = null, junction = 'AND' }) {

        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = ''

        if (where != null || whereOr != null) {
            sql = `UPDATE ${this.TABLE_NAME + (alias ? ' ' + alias : '')} SET ? WHERE`
            if (where) sql += ` (${where && where.map(condition => condition.join(' ')).join(' AND ')}) `
            if (where && whereOr) sql += ` ${junction || 'AND'} `
            if (whereOr) sql += ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `
        } else {
            sql = `INSERT INTO ${this.TABLE_NAME + (alias ? ' ' + alias : '')} SET ? `

            if (updateObj) sql += ' ON DUPLICATE KEY UPDATE ? '
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

    /**
     * Generates 'delete' query
     * @method del
     * 
     * @param {object} delParam
     * 
     * @param {string} [delParam.alias] (optional) local reference name for the database table
     * 
     * @param {Array<Array<string|number|boolean>>} [delParam.where] (optional) array of array containing conditions to filter the record in the database that needs to be 'deleted', each condition is joined using 'and' clause 
     * 
     * @param {Array<Array<string|number|boolean>>} [delParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * 
     * @param {'and'|'or'} [delParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     * 
     * @returns {{success: boolean, result?: *, error?: object }}
     */
    static async del({ alias = null, where = null, whereOr = null, junction = 'AND' }) {
        if (!this.POOL) return { success: false, error: { message: 'Connection pool not defined! Please assign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' } }
        if (!this.TABLE_NAME) return { success: false, error: { message: 'Database table name not mapped! Please assign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' } }
        let sql = `DELETE FROM ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} `


        if (where != null || whereOr != null) {
            sql += ' WHERE '
            if (where) sql += ` (${where && where.map(condition => condition.join(' ')).join(' AND ')}) `
            if (where && whereOr) sql += ` ${junction || 'AND'} `
            if (whereOr) sql += ` (${whereOr && whereOr.map(condition => condition.join(' ')).join(' OR ')}) `
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