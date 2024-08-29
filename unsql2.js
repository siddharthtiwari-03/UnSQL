class UnSQL {

    static orderDirections = ['DESC', 'ASC']
    static junctions = ['AND', 'OR']
    static comparators = ['>', '>=', '<', '<=', '<>', '!=', '<=>', '=', 'BETWEEN', 'NOT BETWEEN', 'IN', 'NOT IN', 'IS', 'IS NOT', 'IS NOT NULL', 'IS NULL', 'LIKE', 'NOT LIKE']
    static placeholders = ['??', "?? AS ?", "AS ?", "CAST(AES_DECRYPT(?? , SHA2(?, 512)) AS CHAR) AS ?", "?"]
    static joinTypes = ['LEFT', 'RIGHT', 'INNER', 'LEFT INNER', 'RIGHT INNER', 'LEFT OUTER', 'RIGHT OUTER', 'CROSS', 'NATURAL INNER', 'NATURAL LEFT OUTER', 'NATURAL RIGHT OUTER']

    static async find({ alias = null, select = [], decrypt = [], cypher = null, subQueries = [], count = [], sum = [], avg = [], least = [], join = [], where = [], whereOr = [], junction = 'AND', groupBy = null, having = null, orderBy = null, orderDirection = 'DESC', rowCount = null, offset = null }) {

        console.log('selectables', select)
        console.log('countables', count)
        console.log('sumables', sum)
        console.log('avgables', avg)

        const aliasPrefix = alias ? `${alias}.` : ''

        if (this.POOL == undefined || this.POOL == null) return { success: false, error: 'Connection pool not defined! Please asign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' }
        if (this.TABLE_NAME == undefined || this.TABLE_NAME == null || this.TABLE_NAME == '') return { success: false, error: 'Database table name not mapped! Please asign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' }
        // let sql = `SELECT ${select} FROM ${this.TABLE_NAME} `
        const values = []
        const query = []
        let sql = `SELECT `
        // if (select.length == 0 && count.length == 0 && sum.length == 0 && avg.length == 0 && subQueries.length == 0) query.push('*')
        if (select.length == 0 && sum.length == 0 && count.length == 0 && avg.length == 0 && subQueries.length == 0) query.push('*')
        console.log('query after 1st if check', query)
        // select columns start here
        select.forEach((selectable, index) => {
            console.log('selectable', selectable)

            const hasAlias = selectable.match(/ as /i)
            const splitted = selectable.split(hasAlias)

            if (selectable == '*') {
                query.push(aliasPrefix + selectable)
            } else if (hasAlias) {
                console.log('inside if block of select')

                query.push((decrypt.includes(splitted[0]) ? this.placeholders[3] : this.placeholders[1]))
                values.push(aliasPrefix + splitted[0])
                if (decrypt.includes(splitted[0])) values.push(cypher)
                values.push(splitted[2])

            } else {
                console.log('inside else block of select')
                console.log('decrypt.includes(selectable)', decrypt.includes(selectable))
                query.push(((decrypt.includes(selectable) ? this.placeholders[3] : this.placeholders[0])))
                values.push(aliasPrefix + selectable)
                if (decrypt.includes(selectable)) {
                    values.push(cypher)
                    values.push(selectable)
                }
            }
            console.log('index', index, 'select.length', select.length)
        })
        // select columns end here
        console.log('query after pushing selectables', query)
        console.log('values after pushing selectables', values)

        // subQueries start here
        if (subQueries.length > 0) query.push(...subQueries)
        // subQueries end here
        console.log('query after pushing subQueries', query)

        // count starts here
        count.forEach((countable, index) => {
            console.log('countable', countable, index)
            // sql += `COUNT(${aliasPrefix + this.placeholders[0]}) `
            query.push(`COUNT(${((countable.split(' ').length == 1) || (countable.toUpperCase().includes(' AS ') && ((countable.split(' ')[0].split(' ').length == 1) || (this.comparators.slice(0, 7).some(operator => countable.split(' ')[0].includes(operator))))) ? aliasPrefix : '') + this.placeholders[0]})` + countable.toUpperCase().includes(' AS ') ? ' ' + this.placeholders[2] : '')
            if (countable.toUpperCase().includes(' AS ')) {
                console.log('inside countable if')
                // sql += this.placeholders[2]
                values.push(countable.split(' ')[0])
                values.push(countable.split(' ')[2])
            } else {
                console.log('inside countable else')
                values.push(countable)
                values.push(countable)
            }
            console.log('index', index)
            // sql += index < count.length - 1 ? ', ' : ' '
        })
        // count ends here

        console.log('query after pushing summable', query)
        console.log('values after pushing summable', values)

        // sum starts here
        sum.forEach((summable, index) => {
            console.log('summable', summable, index)
            // query.push(`SUM(${ ( (summable.split(' ').length == 1) || (summable.toUpperCase().includes(' AS ') && ( (summable.split(' ')[0].split(' ').length == 1) || (!this.comparators.slice(0, 7).some(operator => summable.split(' ')[0].includes(operator)) ) ) ) ? aliasPrefix : '') + this.placeholders[0]})` + summable.toUpperCase().includes(' AS ') ? ' ' + this.placeholders[2] : '')

            let sq = ''
            const hasAlias = summable.match(/ as /i)
            console.log('hasAlias', hasAlias)
            const splitted = summable.split(hasAlias)
            console.log('splitted', splitted)
            const hasComparator = this.comparators.slice(0, 7).some(operator => splitted[0].includes(operator))
            console.log('hasComparator', hasComparator)
            if ((summable.split(' ').length == 1) || !hasComparator) {
                sq += aliasPrefix
            }

            if (!hasComparator) {
                sq += this.placeholders[0]
            } else {
                sq += splitted[0]
            }
            // query.push(`SUM(${(summable.split(' ').length == 1) || !this.comparators.slice(0, 7).some(operator => summable.split(`${summable.match(/ as /i)[0]}`)[0].includes(operator)) ? aliasPrefix : ''}${!this.comparators.slice(0, 7).some(operator => summable.split(`${summable.match(/ as /i)[0]}`)[0].includes(operator)) ? this.placeholders[0] : summable.split(`${summable.match(/ as /i)[0]}`)[0]}) ` + this.placeholders[2])
            query.push(`SUM(${sq}) ` + this.placeholders[2])


            if (hasAlias) {
                console.log('inside summable if block')
                values.push(splitted[1])
                // if (summable.split(' ')[0].split(' ').length > 1) {
                //     sql += `sum(${summable.split(' ')[0]}) `
                // } else {
                //     sql += `sum(${aliasPrefix + this.placeholders[0]}) `
                //     values.push(summable.split(' ')[0])
                // }
                // sql += this.placeholders[2]
                // values.push(summable.split(' ')[2])
            } else {
                console.log('inside summable else block')
                if (!hasComparator) values.push(splitted[0])
                values.push(summable)
            }

            // sql += index < sum.length ? ', ' : ' '
        })
        // sum ends here

        console.log('query after sum', query)
        console.log('values after sum', values)

        // avg starts here
        avg.forEach((average, index) => {
            query.push(`AVG(${((average.split(' ').length == 1) || (average.toUpperCase().includes(' AS ') && ((average.split(' ')[0].split(' ').length == 1) || (this.comparators.slice(0, 7).some(operator => average.split(' ')[0].includes(operator))))) ? aliasPrefix : '') + this.placeholders[0]})` + average.toUpperCase().includes(' AS ') ? ' ' + this.placeholders[2] : '')

            // sql += `AVG(${aliasPrefix + this.placeholders[0]}) `
            if (average.toUpperCase().includes(' AS ')) {
                // sql += this.placeholders[2]
                values.push(average.split(' ')[0])
                values.push(average.split(' ')[1])
            } else {
                values.push(average)
                values.push(average)
            }

            // sql += index < avg.length - 1 ? ', ' : ' '
        })
        // avg ends here

        console.log('query after avg', query)
        console.log('values after avg', values)

        sql += query.join(', ')
        query.length = 0

        sql += ` FROM ?? `
        values.push(this.TABLE_NAME)

        if (alias != null) {
            sql += `?? `
            values.push(alias)
        }

        if (join.length > 0) {
            for (let i = 0; i < join.length; i++) {
                if (join[i].type && join[i].table && join.alias && join[i].on)
                    sql += ` ${join[i].type} JOIN ${join[i].table} ON ${join[i].on} `
                values.push(join.table)
                values.push(join.on)

            }
        }

        if (where.length > 0 || whereOr.length > 0) {
            sql += ' WHERE '
            console.log('inside where block', where, where.length)
            // if (where.length > 0) {
            //     sql += ` ${where.map(condition => condition.join(' ')).join(' AND ')} `
            // }

            const where_query = []

            where.forEach(condition => {
                let where_sql = '('
                if (Array.isArray(condition)) {

                    // handle regular 3 part where object
                    if (condition.length == 3) {

                        console.log('where condition', condition)
                        where_sql += aliasPrefix + this.placeholders[0]
                        values.push(condition[0])
                        const includes = this.comparators.includes(condition[1].toUpperCase())
                        if (!includes) return { success: false, error: "Invalid comparator provided inside where clause: " + condition[1] }
                        console.log('comprarator check for where', includes)
                        where_sql += this.comparators.find(o => o == condition[1].toUpperCase())

                        if (typeof condition[2] === 'object' && !Array.isArray(condition[2])) {
                            console.log('where value found object', condition[2])
                            // deconstruct the where object value
                            const { select: where_select = [], decrypt: where_decrypt = [], from: where_from, alias: where_alias = null, where: where_and = [], whereOr: where_or = [], junction: where_junction = 'AND', cypher: where_cypher = null } = condition[2]

                            where_sql += '(SELECT '

                            const where_aliasPrefix = where_alias ? `${where_alias}.` : ''
                            if (where_select.length == 0) where_sql += where_aliasPrefix + '* '

                            // loop over each select in where clause
                            where_select.forEach(sel => {

                                if (where_decrypt.includes(sel)) {
                                    query.push(where_aliasPrefix + this.placeholders[3])
                                    values.push(sel)
                                    values.push(where_cypher || cypher)
                                } else {
                                    query.push(where_aliasPrefix + this.placeholders[0])
                                    values.push(sel)
                                }
                            })

                            where_sql += `${query.join(', ')} `

                            query.length = 0

                            where_sql += 'FROM ?? '
                            values.push(where_from)

                            if (where_alias != null) {
                                where_sql += `?? `
                                values.push(where_alias)
                            }


                            if (where_and.length > 0 || where_or.length > 0) where_sql += ' WHERE '
                            where_and.forEach(whr => {
                                // where_sql += where_aliasPrefix + this.placeholders[0]
                                const where_includes = this.comparators.includes(whr[1].toUpperCase())
                                if (!where_includes) return { success: false, error: "Invalid comparator inside value parameter of where condition" }

                                query.push('(' + where_aliasPrefix + this.placeholders[0] + ' ' + this.comparators.find(o => o == whr[1].toUpperCase()) + ' ' + (['IN', 'NOT IN'].includes(whr[1].toUpperCase()) ? (`(${whr[2].join(', ')})`) : this.placeholders[4]) + ')')
                                values.push(whr[0])

                                // where_sql += this.placeholders[4]
                                if (!['IN', 'NOT IN'].includes(whr[1].toUpperCase())) values.push(whr[2])
                            })
                            where_sql += query.join(' AND ')
                            query.length = 0

                            if (where_and.length > 0 && where_or.length > 0) where_sql += this.junctions.includes(where_junction) ? where_junction : ' AND '

                            where_or.forEach(whr => {
                                // where_sql += where_aliasPrefix + this.placeholders[0]
                                const where_includes = this.comparators.includes(whr[1].toUpperCase())
                                if (!where_includes) return { success: false, error: "Invalid comparator inside value parameter of where condition" }

                                query.push('(' + where_aliasPrefix + this.placeholders[0] + ' ' + this.comparators.find(o => o == whr[1].toUpperCase()) + ' ' + (['IN', 'NOT IN'].includes(whr[1].toUpperCase()) ? (`(${whr[2].join(', ')})`) : this.placeholders[4]) + ')')
                                values.push(whr[0])

                                // where_sql += this.placeholders[4]
                                values.push(whr[2])
                            })
                            where_sql += query.join(' OR ')
                            query.length = 0

                            where_sql += ')'
                            console.log('where_sql after where and where or are joined', where_sql)
                        } else if (Array.isArray(condition[2])) {

                            where_sql += '(' + condition[2].join(', ') + ')'


                        } else {
                            console.log('where value found  normal string', condition[2])
                            where_sql += ' ' + this.placeholders[4]
                            values.push(condition[2])
                        }
                    }
                }

                where_sql += ')'
                where_query.push(where_sql)
            })

            sql += ` ${where_query.join(' AND ')} `

            if (where.length > 0 && whereOr.length > 0) sql += ` ${this.comparators.includes(junction.toUpperCase()) ? junction : 'AND'} `


            // if (whereOr.length > 0) sql += ` (${whereOr.map(condition => condition.join(' ')).join(' OR ')}) `

            const whereOr_qyery = []
            whereOr.forEach(condition => {
                let whereOr_sql = '('
                if (Array.isArray(condition)) {

                    // handle regular 3 part where object
                    if (condition.length == 3) {

                        console.log('whereOr condition', condition)
                        whereOr_sql += aliasPrefix + this.placeholders[0]
                        values.push(condition[0])
                        const includes = this.comparators.includes(condition[1].toUpperCase())
                        if (!includes) return { success: false, error: "Invalid comparator provided inside where clause: " + condition[1] }
                        console.log('comprarator check for whereOr', includes)
                        whereOr_sql += this.comparators.find(o => o == condition[1].toUpperCase())

                        if (typeof condition[2] === 'object' && !Array.isArray(condition[2])) {

                            // deconstruct the where object value
                            const { select: where_select = [], decrypt: where_decrypt = [], from: where_from, alias: where_alias, where: where_and, whereOr: where_or, junction: where_junction, cypher: where_cypher = null } = condition[2]

                            whereOr_sql += '(SELECT '

                            const where_aliasPrefix = where_alias ? `${where_alias}.` : ''
                            if (select.length == 0) whereOr_sql += where_aliasPrefix + '* '

                            // loop over each select in where clause
                            where_select.forEach(sel => {

                                if (where_decrypt.includes(sel)) {
                                    query.push(where_aliasPrefix + this.placeholders[3])
                                    values.push(sel)
                                    values.push(where_cypher || cypher)
                                } else {
                                    query.push(where_aliasPrefix + this.placeholders[0])
                                    values.push(sel)
                                }
                            })

                            whereOr_sql += `${query.join(', ')} `

                            query.length = 0

                            whereOr_sql += 'FROM ?? '
                            values.push(where_from)

                            if (where_alias != null) {
                                whereOr_sql += `?? `
                                values.push(where_alias)
                            }


                            if (where_and.length > 0 || where_or.length > 0) whereOr_sql += ' WHERE '
                            where_and.forEach(whr => {
                                // whereOr_sql += where_aliasPrefix + this.placeholders[0]
                                const where_includes = this.comparators.includes(whr[1].toUpperCase())
                                if (!where_includes) return { success: false, error: "Invalid comparator inside value parameter of where condition" }

                                query.push('(' + where_aliasPrefix + this.placeholders[0] + ' ' + this.comparators.find(o => o == whr[1].toUpperCase()) + ' ' + this.placeholders[4] + ')')
                                values.push(whr[0])

                                // whereOr_sql += this.placeholders[4]
                                values.push(whr[2])
                            })
                            whereOr_sql += query.join(' AND ')
                            query.length = 0

                            if (where_and.length > 0 && where_or.length > 0) whereOr_sql += this.junctions.includes(where_junction) ? where_junction : ' AND '

                            where_or.forEach(whr => {
                                // whereOr_sql += where_aliasPrefix + this.placeholders[0]
                                const where_includes = this.comparators.includes(whr[1].toUpperCase())
                                if (!where_includes) return { success: false, error: "Invalid comparator inside value parameter of where condition" }

                                query.push('(' + (where_aliasPrefix + this.placeholders[0]) + ' ' + (this.comparators.find(o => o == whr[1].toUpperCase())) + ' ' + (this.placeholders[4]) + ')')
                                values.push(whr[0])

                                // whereOr_sql += this.placeholders[4]
                                values.push(whr[2])
                            })
                            whereOr_sql += query.join(' OR ')
                            query.length = 0

                            whereOr_sql += ')'

                        } else if (Array.isArray(condition[2])) {
                            whereOr_sql += '(' + condition[2].join(', ') + ')'
                        } else {
                            whereOr_sql += ' ' + this.placeholders[4]
                            values.push(condition[2])
                        }
                    }
                }

                whereOr_sql += ')'

                whereOr_qyery.push(whereOr_sql)
            })

            sql += ` ${whereOr_qyery.join(" OR ")} `
        }

        if (groupBy != null) sql += ` GROUP BY ${groupBy} `
        if (having != null) sql += ` HAVING ${having} `
        if (orderBy != null) {
            sql += ` ORDER BY ${orderBy} `
            if (['ASC', 'DESC'].includes(orderDirection.toUpperCase())) sql += ` ${orderDirection} `
        }

        if (!isNaN(parseInt(rowCount)) && !isNaN(parseInt(offset))) {
            sql += ` LIMIT ${rowCount} OFFSET ${offset} `
        } else if (!isNaN(parseInt(rowCount)) && isNaN(parseInt(offset))) {
            sql += ` LIMIT ${rowCount} `
        }

        const connection = await this.POOL.getConnection()

        try {


            await connection.beginTransaction()

            console.log('sql before execute', sql)
            console.log('values before execute', values)

            const query = await connection.format(sql, values)

            const [rows, fields] = await connection.query(query)
            await connection.commit()
            console.log('rows', rows)
            return { success: true, result: rows }
        } catch (error) {
            await connection.rollback()
            return { success: false, error }
        } finally {
            await connection.release()
        }
    }

    static save({ alias = null, data, updateObj = null, where = null, whereOr = null, junction = 'AND' }) {
        return new Promise((resolve, reject) => {
            if (this.POOL == undefined || this.POOL == null) return resolve({ success: false, error: 'Connection pool not defined! Please asign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' })
            if (this.TABLE_NAME == undefined || this.TABLE_NAME == null || this.TABLE_NAME == '') return resolve({ success: false, error: 'Database table name not mapped! Please asign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' })
            let sql = ''

            if (where != null || whereOr != null) {
                sql = `UPDATE ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} SET ? WHERE`
                if (where) sql += ` (${where.map(condition => condition.join(' ')).join(' AND ')})`
                if (where && whereOr && junction) sql += ` ${junction ? junction : 'AND'} `
                if (whereOr) sql += ` (${whereOr.map(condition => condition.join(' ')).join(' OR ')}) `
            } else {
                sql = `INSERT INTO ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} SET ? `
                if (updateObj != null) {
                    sql += ' ON DUPLICATE KEY UPDATE ? '
                    data = [data, updateObj]
                }
            }

            try {
                this.POOL.query(sql, data, (error, result) => {
                    if (error) return resolve({ success: false, error })
                    return resolve({ success: true, insertID: result.insertId })
                })
            } catch (error) {
                return resolve({ success: false, error })
            }
        })
    }

    static async saveSecure({ alias = null, data, updateObj = null, where = null, whereOr = null, junction = 'AND', encryptColumns = null, cypher = null }) {
        const connection = await this.POOL.getConnection()

        if (encryptColumns != null && ((cypher == null || cypher == '') && !encryptColumns.contains('cypher'))) {
            return { success: false, error: 'Please provide cypher key to encrypt columns' }
        }

        try {
            await connection.beginTransaction()
        } catch (error) {
            return { success: false, error: 'Error while begining transaction: ', error, message }
        }

        const statements = []
        const values = []

        for await (const [key, val] of Object.entries(data)) {
            if (encryptColumns != null && (encryptColumns.includes('*') || encryptColumns.includes(key))) {
                statements.push(`${key} = AES_ENCRYPT(?, ?)`)
                values.push(val, cypher)
            } else {
                statements.push(`${key} = ?`)
                values.push(val)
            }
        }

        let sql = ` ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} SET ${statements.join(', ')} `

        if (where != null || whereOr != null) {
            sql = `UPDATE ${sql} WHERE`
            if (where) sql += ` (${where.map(condition => condition.join(' ')).join(' AND ')}) `
            if (where && whereOr && junction) sql += ` ${junction ? junction : 'AND'} `
            if (whereOr) sql += ` (${whereOr.map(condition => condition.join(' ')).join(' OR ')}) `
        } else {
            sql = `INSERT INTO ` + sql
            if (updateObj != null) {
                sql += ' ON DUPLICATE KEY UPDATE ? '
                data = [data, updateObj]
            }
        }
        console.log('sql to be executed', sql)
        console.log('values', values)
        try {
            const result = await connection.query(sql, values)
            console.log('result from execution', result)

            await connection.commit()

            return { success: true, result }
        } catch (error) {
            console.log('error while query execution', error)
            await connection.rollback()
            return { success: false, error }
        } finally {
            await connection.release()
        }

    }

    static del({ alias = null, where = null, whereOr = null, junction = 'AND' }) {
        return new Promise((resolve, reject) => {
            if (this.POOL == undefined || this.POOL == null) return resolve({ success: false, error: 'Connection pool not defined! Please asign a mysql connection pool variable as a \'static POOL="your_mysql_connection_pool"\' inside model class.' })
            if (this.TABLE_NAME == undefined || this.TABLE_NAME == null || this.TABLE_NAME == '') return resolve({ success: false, error: 'Database table name not mapped! Please asign a mysql table name variable as a \'static TABLE_NAME="db_table_name"\' inside model class.' })
            let sql = `DELETE FROM ${this.TABLE_NAME + (alias != null ? ' ' + alias : '')} `

            if (where != null || whereOr != null) {
                sql += ' WHERE '
                if (where) sql += ` (${where.map(condition => condition.join(' ')).join(' AND ')}) `
                if (where && whereOr) sql += ` ${junction ? junction : 'AND'} `
                if (whereOr) sql += ` (${whereOr.map(condition => condition.join(' ')).join(' OR ')})`
            }

            try {
                this.POOL.query(sql, (error, result) => {
                    if (error) return resolve({ success: false, error })
                    return resolve({ success: true, insertID: result.insertId })
                })
            } catch (error) {
                return resolve({ success: false, error })
            }
        })
    }

    static async rawQuery(query) {
        try {
            const connection = await this.POOL.getConnection()

            try {
                await connection.beginTransaction()

                const result = await connection.query(query)

                await connection.commit()

                return { success: true, result }
            } catch (error) {
                await connection.rollback()
                return { success: false, error }
            } finally {
                await connection.release()
            }

        } catch (error) {
            return { success: false, error }
        }
    }

}

module.exports = UnSQL