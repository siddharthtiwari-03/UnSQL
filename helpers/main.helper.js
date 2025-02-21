const { colors } = require("./console.helper")
const { checkConstants, dataTypes, aggregateFunctions, constantFunctions } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

const junctions = Object.freeze({
    and: ' AND ',
    or: ' OR '
})

const conditions = Object.freeze({
    eq: ' = ',
    gt: ' > ',
    lt: ' < ',
    gtEq: ' >= ',
    ltEq: ' <= ',
    notEq: ' != ',
    isNull: ' IS NULL',
    isNotNull: ' IS NOT NULL',
    like: ' LIKE ',
    startLike: ' LIKE ',
    endLike: ' LIKE ',
    notStartLike: ' NOT LIKE ',
    notEndLike: ' NOT LIKE ',
    notLike: ' NOT LIKE ',
    in: ' IN ',
    notIn: ' NOT IN '
})

const joinTypes = Object.freeze({
    left: 'LEFT',
    right: 'RIGHT',
    inner: 'INNER'
})

/**
 * prepares select query using various 
 * @function prepSelect
 * @param {Object} selectParam
 * @param {string} [selectParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").SelectObject} selectParam.select array of columns / values / wrapper methods
 * @param {import("../defs/types").EncryptionConfig} [selectParam.encryption] (optional) query level encryption configuration
 * @param {*} [selectParam.ctx] (optional) context reference of the parent model class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepSelect = ({ alias, select = [], encryption = undefined, ctx = undefined }) => {

    const values = []

    select = select.length ? select : ['*']

    const sql = select.map(selectable => {

        if (typeof selectable === 'object' && !Array.isArray(selectable)) {

            const [[key, val]] = Object.entries(selectable)

            switch (true) {

                case key === 'date': {
                    const resp = prepDate({ alias, val, encryption, ctx })
                    values.push(...resp?.values)
                    return resp?.sql
                }

                case key === 'str': {
                    const resp = prepString({ alias, val, encryption, ctx })
                    values.push(...resp?.values)
                    return resp?.sql
                }

                case key === 'num': {
                    const resp = prepNumeric({ alias, val, encryption, ctx })
                    values.push(...resp?.values)
                    return resp?.sql
                }

                case key === 'json':
                case key === 'array': {
                    val.as = val.as || key
                    const resp = prepJson({ alias, key, val, encryption, ctx })
                    values.push(...resp?.values)
                    return resp?.sql
                }

                case key in aggregateFunctions: {
                    const resp = prepAggregate({ alias, key, val, encryption, ctx })
                    values.push(...resp.values)
                    return resp?.sql
                }

                case key === 'refer': {
                    const resp = prepRefer({ val, encryption, ctx })
                    values.push(...resp.values)
                    return resp?.sql
                }

                case key === 'if': {
                    const resp = prepIf({ alias, val, encryption, ctx })
                    values.push(...resp.values)
                    return resp.sql
                }

                case key === 'case': {
                    const resp = prepCase({ alias, val, encryption, ctx })
                    values.push(...resp.values)
                    return resp.sql
                }

                case key === 'concat': {
                    const resp = prepConcat({ alias, val, encryption, ctx })
                    values.push(...resp.values)
                    return resp.sql
                }

            }

        }

        let placeholder = prepPlaceholder({ value: selectable, ctx })

        if (isVariable(placeholder)) {
            const name = prepName({ alias, value: selectable })
            values.push(name)
            if (placeholder?.startsWith('$')) placeholder += ' AS ' + name
        }

        return placeholder
    }).join(', ')

    return { sql, values }

}

/**
 * prepares where statement
 * @function prepWhere
 * @param {Object} whereParam
 * @param {string} [whereParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").WhereObject|import("../defs/types").HavingObject} [whereParam.where] (optional) allows to filter records using various conditions
 * @param {'and'|'or'} [whereParam.junction] (optional) clause used to connect multiple where conditions
 * @param {import("../defs/types").EncryptionConfig} [whereParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [whereParam.ctx] (optional) local reference name of the table
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepWhere = ({ alias, where = {}, parent = null, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const values = []

    const entriesResp = Object.entries(where).map(([key, val]) => {

        let sql = ''

        switch (true) {

            case key === 'and':
            case key === 'or': {
                const mapResp = val.map(condition => {
                    const resp = prepWhere({ alias, where: condition, junction, parent, encryption, ctx })
                    values.push(...resp.values)

                    return resp.sql
                })
                sql += (mapResp.length > 1 ? '(' : '') + mapResp.join(junctions[key]) + (mapResp.length > 1 ? ')' : '')
                break
            }

            case key === 'between': {
                const { gt, lt } = val
                if (parent && !(parent in conditions)) {
                    const parentPlaceholder = prepPlaceholder({ value: parent, alias, ctx })
                    sql += parentPlaceholder
                    if (isVariable(parentPlaceholder)) {
                        const parentName = prepName({ alias, value: parent })
                        values.push(parentName)
                    }
                }

                sql += ' BETWEEN '

                if (typeof gt === 'object') {
                    const gtResp = prepWhere({ alias, where: gt, junction, encryption, ctx })
                    sql += gtResp.sql
                    values.push(...gtResp.values)
                } else {
                    const gtPlaceholder = prepPlaceholder({ value: gt, alias, ctx })
                    sql += gtPlaceholder
                    if (isVariable(gtPlaceholder)) {
                        const gtName = prepName({ alias, value: gt })
                        values.push(gtName)
                    }
                }

                sql += ' AND '

                if (typeof lt === 'object') {
                    const ltResp = prepWhere({ alias, where: lt, junction, encryption, ctx })
                    sql += ltResp.sql
                    values.push(...ltResp.values)
                } else {
                    const ltPlaceholder = prepPlaceholder({ value: lt, alias, ctx })
                    sql += ltPlaceholder
                    if (isVariable(ltPlaceholder)) {
                        const ltName = prepName({ alias, value: lt })
                        values.push(ltName)
                    }
                }
                break
            }

            case key === 'refer': {
                if (parent && !(parent in conditions)) {
                    const parentPlaceholder = prepPlaceholder({ value: parent, alias, ctx })
                    sql += parentPlaceholder
                    if (isVariable(parentPlaceholder)) {
                        const parentName = prepName({ alias, value: parent })
                        values.push(parentName)
                    }
                    sql += ' = '
                }

                const resp = prepRefer({ val, parent, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

            case key === 'case': {
                const resp = prepCase({ alias, val, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

            case key === 'if': {
                const resp = prepIf({ alias, val, junction, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

            case key === 'concat': {
                const resp = prepConcat({ alias, val, junction, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

            case key === 'date': {
                const resp = prepDate({ alias, val, encryption, ctx })
                sql += resp?.sql
                values.push(...resp?.values)
                break
            }

            case key === 'str': {
                const resp = prepString({ alias, val, encryption, ctx })
                sql += resp?.sql
                values.push(...resp?.values)
                break
            }

            case key === 'num': {
                const resp = prepNumeric({ alias, val, encryption, ctx })
                sql += resp?.sql
                values.push(...resp?.values)
                break
            }

            case key === 'json':
            case key === 'array': {
                const jsonResp = prepJson({ key, val, encryption, ctx })
                sql += jsonResp.sql
                values.push(...jsonResp.values)
                break
            }

            case key in conditions: {
                if (parent && !(parent in conditions) && parent != 'from') {
                    const parentPlaceholder = prepPlaceholder({ value: parent, alias, ctx })
                    sql += parentPlaceholder
                    if (isVariable(parentPlaceholder)) {
                        const parentName = prepName({ alias, value: parent })
                        values.push(parentName)
                    }
                }

                sql += conditions[key]

                if (key === 'isNull' || key === 'isNotNull') break

                if (key === 'in') sql += '('
                else if (key === 'like' || key === 'notLike' || key === 'endLike' || key === 'notEndLike' || key === 'startLike' || key === 'notStartLike') sql += `CONCAT(${key != 'startLike' && key != 'notStartLike' ? '"%", ' : ''} `

                if (typeof val === 'object') {
                    const resp = prepWhere({ alias, where: val, parent: key, junction, encryption, ctx })
                    sql += resp.sql
                    values.push(...resp.values)
                } else {
                    const valPlaceholder = prepPlaceholder({ value: val, alias, ctx })
                    sql += valPlaceholder
                    if (isVariable(valPlaceholder)) {
                        const valName = prepName({ alias, value: val })
                        values.push(valName)
                    }
                }

                if (key === 'like' || key === 'notLike' || key === 'startLike' || key === 'notStartLike' || key === 'endLike' || key === 'notEndLike') sql += `${key != 'endLike' && key != 'notEndLike' ? ' ,"%"' : ''})`
                else if (key === 'in') sql += ')'
                break
            }

            case key in aggregateFunctions: {
                const resp = prepAggregate({ alias, key, parent, junction, val, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

            case Array.isArray(val): {
                const keyPlaceholder = prepPlaceholder({ value: key, alias, ctx })
                sql += keyPlaceholder
                if (isVariable(keyPlaceholder)) {
                    const keyName = prepName({ alias, value: key })
                    values.push(keyName)
                }

                sql += ' IN ('

                sql += val.map(value => {
                    const valPlaceholder = prepPlaceholder({ value, alias, ctx })
                    if (isVariable(valPlaceholder)) {
                        const valName = prepName({ alias, value })
                        values.push(valName)
                    }
                    return valPlaceholder
                }).join(', ')

                sql += ')'
                break
            }

            case typeof val === 'number':
            case typeof val === 'string': {
                const keyPlaceholder = prepPlaceholder({ value: key, alias, ctx })
                sql += keyPlaceholder
                if (isVariable(keyPlaceholder)) {
                    const keyName = prepName({ alias, value: key })
                    values.push(keyName)
                }

                if (val === 'isNull' || val === 'isNotNull') {
                    sql += conditions[val]
                    break
                }

                const valPlaceholder = prepPlaceholder({ value: val, alias, ctx })
                sql += ' = ' + valPlaceholder
                if (isVariable(valPlaceholder)) {
                    const valName = prepName({ alias, value: val })
                    values.push(valName)
                }
                break
            }

            default: {
                const resp = prepWhere({ alias, where: val, parent: key, junction, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)
                break
            }

        }

        return sql
    })

    return { sql: entriesResp.join(junctions[junction]), values }
}

/**
 * prepares join query statement
 * @function prepJoin
 * @param {Object} joinParam
 * @param {string} [joinParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").JoinObject} joinParam.join array of joining conditions
 * @param {import("../defs/types").EncryptionConfig} [joinParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [joinParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJoin = ({ alias, join = [], encryption = undefined, ctx = undefined }) => {
    const values = []

    const resp = join.map(joinable => {

        const { type = null, select = [], table, alias: joinAlias = null, join: nestedJoin = [], where = {}, groupBy = [], having = {}, orderBy = {}, junction = 'and', using = [], limit = undefined, offset = undefined, as = null } = joinable

        if (!table) {
            console.error(colors.red, `[Missing]: property 'table' name is missing inside 'join' clause`, colors.reset)
            throw new Error('Table name to be associated is missing', { cause: "Missing 'table' property inside join object" })
        }

        let sql = ''

        if (joinTypes[type]) sql += joinTypes[type]

        sql += ' JOIN '

        if (select.length || nestedJoin.length) {

            sql += '(SELECT '

            const selectResp = prepSelect({ alias: joinAlias, select, encryption, ctx })
            sql += selectResp.sql
            values.push(...selectResp.values)

            sql += ' FROM ' + (this?.config?.dialect === 'mysql' ? '??' : table)
            if (this?.config?.dialect === 'mysql') {
                values.push(table)
                if (joinAlias) {
                    sql += ' ??'
                    values.push(joinAlias)
                }
            } else if (joinAlias) {
                sql += ` ${joinAlias}`
            }

            if (nestedJoin.length) {
                const joinResp = prepJoin({ alias, join: nestedJoin, encryption, ctx })
                sql += joinResp.sql
                values.push(...joinResp.values)
            }

            if (Object.keys(where).length) {
                sql += ' WHERE '
                const whereResp = prepWhere({ alias: joinAlias, where, junction, encryption, ctx })
                sql += whereResp.sql
                values.push(...whereResp.values)
            }

            const groupByResp = patchGroupBy({ groupBy, alias, ctx })
            sql += groupByResp.sql
            values.push(...groupByResp.values)

            if (Object.keys(having).length) {
                sql += ' HAVING '
                const havingResp = prepWhere({ alias: joinAlias, having, junction, encryption, ctx })
                sql += havingResp.sql
                values.push(...havingResp.values)
            }

            const orderResp = prepOrderBy({ alias, orderBy, ctx })
            sql += orderResp.sql
            values.push(...orderResp.values)

            const limitResp = patchLimit(limit, ctx)
            sql += limitResp.sql
            values.push(...limitResp.values)

            const offsetResp = patchLimit(offset, ctx, 'OFFSET')
            sql += offsetResp.sql
            values.push(...offsetResp.values)

            if (!as) {
                console.error(colors.red, 'Missing "as" property when using selective join association', colors.reset)
                throw new Error('Missing "as" property with selective join association', { cause: "Missing 'as' property inside join object with 'select' property" })
            }

            sql += ') AS ?? '
            values.push(as)

        } else {

            sql += '?? '
            values.push(table)

            if (joinAlias) {
                sql += '?? '
                values.push(joinAlias)
            }

        }

        if (!using.length) {
            console.error(colors.red, 'Using clause missing', colors.reset)
            throw new Error('Common column(s) to associate tables is missing', { cause: "Missing conditions for association in 'using' clause" })
        }

        if (using.some(condition => typeof condition === 'object')) {
            sql += 'ON '

            sql += using.map(condition => {
                const [[parentColumn, childColumn]] = Object.entries(condition)

                values.push((alias ? alias + '.' + parentColumn : parentColumn))
                values.push(((as || joinAlias) ? (as || joinAlias) + '.' + childColumn : childColumn))

                return '?? = ??'
            }).join(' AND ')
        } else {
            sql += 'USING('
            sql += using.map(commonColumn => {
                values.push(commonColumn)
                return '??'
            }).join(', ')
            sql += ')'
        }

        return sql
    })

    return { sql: resp.join(' '), values }

}

/**
 * prepares sub query that generates json object / array with aggregate wrapper (optional)
 * @function prepJson
 * @param {Object} jsonParam object with different properties that help generate a json object / array
 * @param {'json'|'array'} [jsonParam.key] (optional) alias reference for the table name
 * @param {import("../defs/types").BaseJson} jsonParam.val accepts values related to sub-query
 * @param {import("../defs/types").EncryptionConfig} [jsonParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [jsonParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJson = ({ key, val, encryption = undefined, junction = 'and', ctx = undefined }) => {
    console.log('prepJson invoked', val)
    let sql = ''
    const values = []

    const { value, table = null, alias = null, join = [], where = {}, groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, as = null, extract = null, contains = null, compare = {} } = val

    if (table || Object.keys(where).length || Object.keys(having).length) sql += '(SELECT '

    let jsonSql = ''

    if (typeof value === 'string') {
        const jsPlaceholder = prepPlaceholder({ value, alias, ctx })
        if (isVariable(jsPlaceholder)) {
            const jsName = prepName({ alias, value })
            values.push(jsName)
        }
        jsonSql = jsPlaceholder
        // const jsonResp = prepJsonExtract(jsPlaceholder, extract, ctx)
        // values.push(...jsonResp.values)
        // sql += jsonResp.sql
    } else {
        if (ctx?.config?.dialect === 'postgresql') {
            const jsonbResp = generateJsonbObject(value, ctx, key)
            // const jsonRef = jsonbResp.sql
            jsonSql = jsonbResp.sql
            values.push(...jsonbResp.values)
            // const jsonResp = prepJsonExtract(jsonRef, extract, ctx)
            // jsonSql = jsonResp.sql
            // values.push(...jsonResp.values)
        } else { // handle json if dialect is 'mysql'
            console.log('val is object', val)
            jsonSql = Object.entries(value).map(([k, v]) => {
                console.log('k', k)
                console.log('v')
                console.dir(v, { depth: 100 })
                const kPlaceholder = '?'
                if (!Array.isArray(value)) values.push(k)

                let vPlaceholder

                if (typeof v === 'object' && ('str' in v || 'num' in v || 'date' in v || 'concat' in v)) {
                    console.log('v has wrapper method')
                    const selectResp = prepSelect({ select: [v], ctx, encryption })
                    vPlaceholder = selectResp.sql
                    values.push(...selectResp.values)
                } else {
                    console.log('no wrapper method in json object')
                    vPlaceholder = prepPlaceholder({ value: v, alias, ctx })
                    if (isVariable(vPlaceholder)) {
                        const vName = prepName({ alias, value: v })
                        console.log('vName', vName)
                        values.push(vName)
                    }
                }
                console.log('vPlaceholder', vPlaceholder)
                return (!Array.isArray(value) ? `${kPlaceholder}, ` : '') + vPlaceholder
            }).join(', ')
            console.log('jsonSql after loop', jsonSql)
            if ((key === 'json' || !Array.isArray(value))) jsonSql = `JSON_OBJECT(${jsonSql})`
            else if (key === 'array' && Array.isArray(value)) jsonSql = `JSON_ARRAY(${jsonSql})`
            else if (key === 'array' && !Array.isArray(value)) jsonSql = `JSON_ARRAYAGG(${jsonSql})`
        }
    }

    const jsonResp = prepJsonExtract(jsonSql, extract, ctx)
    values.push(...jsonResp.values)
    jsonSql = jsonResp.sql

    const jsonContainResp = prepJsonContains(jsonSql, contains, ctx)
    values.push(...jsonContainResp.values)
    jsonSql = jsonContainResp.sql

    sql += jsonSql // finally patching jsonSql (with all wrappers and methods) to main sql

    if (table) {
        sql += ' FROM ' + (this?.config?.dialect === 'mysql' ? '??' : table)
        if (this?.config?.dialect === 'mysql') {
            values.push(table)
            if (alias) {
                sql += ' ??'
                values.push(alias)
            }
        } else if (alias) {
            sql += ` ${alias}`
        }
    }

    if (join.length) {
        const joinResp = prepJoin({ alias, join, encryption, ctx })
        sql += joinResp.sql
        values.push(...joinResp.values)
    }

    if (Object.keys(where).length) {
        sql += ' WHERE '
        const whereResp = prepWhere({ alias, where, junction: 'and', encryption, ctx })
        sql += whereResp.sql
        values.push(...whereResp.values)
    }

    const groupByResp = patchGroupBy({ groupBy, alias, ctx })
    sql += groupByResp.sql
    values.push(...groupByResp.values)

    if (Object.keys(where).length) {
        sql += ' HAVING '
        const whereResp = prepWhere({ alias, where, junction: 'and', encryption, ctx })
        sql += whereResp.sql
        values.push(...whereResp.values)
    }

    const orderResp = prepOrderBy({ alias, orderBy, ctx })
    sql += orderResp.sql
    values.push(...orderResp.values)

    const limitResp = patchLimit(limit, ctx)
    sql += limitResp.sql
    values.push(...limitResp.values)

    const offsetResp = patchLimit(offset, ctx, 'OFFSET')
    sql += offsetResp.sql
    values.push(...offsetResp.values)

    if (table || Object.keys(where).length || Object.keys(having).length) sql += ')'

    if (as) {
        sql += ` AS ${(ctx?.config?.dialect === 'mysql' ? '?' : as)}`
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }

    if (Object.keys(compare).length) {
        const compareResp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += compareResp.sql
        values.push(...compareResp.values)
    }

    return { sql, values }

}

/**
 * prepares aggregate functions
 * @function prepAggregate
 * @param {Object} aggParam object with different properties that help generate aggregate method
 * @param {string} [aggParam.alias] (optional) local reference name of the table
 * @param {string} aggParam.key refers the name of the aggregate method, viz. 'sum', 'avg', 'min', 'max' etc.
 * @param {import("../defs/types").BaseAggregate} aggParam.val accepts values related to aggregate method
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepAggregate = ({ alias, key, val, parent = null, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const values = []
    let sql = ''

    const { value, distinct = false, cast = null, compare = {}, as = null } = val

    if (cast) sql += 'CAST('

    sql += aggregateFunctions[key] + '('
    if (distinct) sql += 'DISTINCT '

    if (typeof value === 'object') {
        const resp = prepWhere({ alias, where: value, parent, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    } else {
        const placeholder = prepPlaceholder({ value, alias, ctx })
        sql += placeholder
        if (isVariable(placeholder)) {
            const name = prepName({ alias, value })
            values.push(name)
        }
    }

    sql += ')'

    // type casting ends here
    if (cast) sql += ` AS ${dataTypes[cast]})`

    if (as) {
        sql += ' AS ' + (ctx?.config?.dialect === 'mysql' ? '?' : as)
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }

    if (Object.keys(compare).length) {

        const compareResp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += compareResp.sql
        values.push(...compareResp.values)
    }

    return { sql, values }
}

/**
 * prepares sub query
 * @function prepRefer
 * @param {Object} referParam object with different properties that help generate aggregate method
 * @param {import("../defs/types").BaseQuery} referParam.val accepts values related to aggregate method
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepRefer = ({ val, parent = null, encryption = undefined, ctx = undefined }) => {

    const { select = ['*'], table, alias = null, join = [], where = {}, junction = 'and', groupBy = [], having = {}, orderBy = {}, limit = null, offset = null, as = null } = val

    let sql = ''

    const values = []

    sql += '(SELECT '

    const selectResp = prepSelect({ alias, select, encryption, ctx })

    sql += selectResp.sql
    values.push(...selectResp.values)

    sql += ' FROM ' + (this?.config?.dialect === 'mysql' ? '??' : table)
    if (this?.config?.dialect === 'mysql') {
        values.push(table)
        if (alias) {
            sql += ' ??'
            values.push(alias)
        }
    } else if (alias) {
        sql += ` ${alias}`
    }

    if (alias) {
        sql += ' ??'
        values.push(alias)
    }

    if (join.length) {
        const joinResp = prepJoin({ alias, join, encryption, ctx })
        sql += joinResp.sql
        values.push(...joinResp.values)
    }

    if (Object.keys(where).length) {
        sql += ' WHERE '
        const whereResp = prepWhere({ alias, where, junction, parent, encryption, ctx })
        sql += whereResp.sql
        values.push(...whereResp.values)
    }

    if (groupBy.length) {
        sql += ' GROUP BY '
        sql += groupBy.map(gb => {
            if (ctx?.config?.dialect === 'mysql') values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
            return ctx?.config?.dialect === 'mysql' ? '??' : (gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
        }).join(', ')
    }

    if (Object.keys(having).length) {
        sql += ' HAVING '
        const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx })
        sql += havingResp.sql
        values.push(...havingResp.values)
    }

    const orderResp = prepOrderBy({ alias, orderBy, ctx })
    sql += orderResp.sql
    values.push(...orderResp.values)

    const limitResp = patchLimit(limit, ctx)
    sql += limitResp.sql
    values.push(...limitResp.values)

    const offsetResp = patchLimit(offset, ctx, 'OFFSET')
    sql += offsetResp.sql
    values.push(...offsetResp.values)

    sql += ')'

    if (as) {
        sql += ` AS ${ctx?.config?.dialect === 'mysql' ? '?' : as}`
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }

    return { sql, values }

}

/**
 * prepares if else condition
 * @function prepIf
 * @param {Object} ifParam
 * @param {string} [ifParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").IfObject} ifParam.val
 * @param {'and'|'or'}  [ifParam.junction] (optional) clause used to join conditions
 * @param {import("../defs/types").EncryptionConfig} [ifParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [ifParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepIf = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    let sql = ''
    const values = []
    const { check = {}, trueValue = null, falseValue = null, as = null } = val
    sql += 'IF('

    if (typeof check === 'object') {
        const resp = prepWhere({ alias, where: check, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    } else {
        const ifPlaceholder = prepPlaceholder({ value: check, alias, ctx })
        sql += ifPlaceholder
        if (isVariable(ifPlaceholder)) {
            const ifName = prepName({ alias, value: check })
            values.push(ifName)
        }
    }

    sql += ', '

    if (typeof trueValue === 'object') {
        const trueResp = prepWhere({ alias, where: trueValue, junction, encryption, ctx })
        sql += trueResp.sql
        values.push(...trueResp.values)
    } else {
        const truePlaceholder = prepPlaceholder({ value: trueValue, alias, ctx })
        sql += truePlaceholder
        if (isVariable(truePlaceholder)) {
            const trueName = prepName({ alias, value: trueValue })
            values.push(trueName)
        }
    }
    sql += ', '

    if (typeof falseValue === 'object') {
        const falseResp = prepWhere({ alias, where: falseValue, junction, encryption, ctx })
        sql += falseResp.sql
        values.push(...falseResp.values)
    } else {
        const falsePlaceholder = prepPlaceholder({ value: falseValue, alias, ctx })
        sql += falsePlaceholder + ')'

        if (isVariable(falsePlaceholder)) {
            const falseName = prepName({ alias, value: falseValue })
            values.push(falseName)
        }
    }

    if (as) {
        sql += ` AS ${ctx?.config?.dialect === 'mysql' ? '?' : as}`
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }

    return { sql, values }
}

/**
 * prepares switch case
 *@function prepCase
 @param caseParam
 @param {string} [caseParam.alias] (optional) local reference to table name
 @param {import("../defs/types").SwitchObject} caseParam.val
 @param {'and'|'or'} [caseParam.junction] (optional) clause used to join conditions
 @param {import("../defs/types").EncryptionConfig} [caseParam.encryption] (optional) inherits encryption config from its parent level
 @param {*} [caseParam.ctx] context reference to parent class
 @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepCase = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {
    let sql = ''
    const values = []

    const { check = [], else: defaultElse, as = null } = val

    sql += 'CASE '

    sql += check.map(condition => {

        const { when, then } = condition

        let localSQL = 'WHEN '
        if (typeof when === 'object') {
            const whenResp = prepWhere({ alias, where: when, junction, encryption, ctx })
            localSQL += whenResp.sql
            values.push(...whenResp.values)
        } else {
            const whenPlaceholder = prepPlaceholder({ value: when, alias, ctx })
            localSQL += whenPlaceholder
            if (isVariable(whenPlaceholder)) {
                const whenName = prepName({ alias, value: when })
                values.push(whenName)
            }
        }

        localSQL += ' THEN '
        if (typeof then === 'object') {
            const thenResp = prepWhere({ alias, where: then, junction, encryption, ctx })
            localSQL += thenResp.sql
            values.push(...thenResp.values)
        } else {
            const thenPlaceholder = prepPlaceholder({ value: then, alias, ctx })
            localSQL += thenPlaceholder
            if (isVariable(thenPlaceholder)) {
                const thenName = prepName({ alias, value: then })
                values.push(thenName)
            }
        }
        return localSQL
    }).join(' ')

    sql += ' ELSE '

    const elsePlaceholder = prepPlaceholder({ value: defaultElse, alias, ctx })
    sql += elsePlaceholder

    if (isVariable(elsePlaceholder)) {
        const elseName = prepName({ alias, value: defaultElse })
        values.push(elseName)
    }

    sql += ' END'

    if (as) {
        sql += ` AS ${ctx?.config?.dialect === 'mysql' ? '?' : as}`
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }
    return { sql, values }
}

/**
 * concat values
 * @function prepConcat
 * @param {Object} concatParam
 * @param {string} [concatParam.alias] (optional) local reference to table name
 * @param {import("../defs/types").ConcatObject} concatParam.val
 * @param {import("../defs/types").EncryptionConfig} [concatParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [concatParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepConcat = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const { value = [], pattern = '', as = null, compare = {} } = val

    const values = []

    const patternPlaceholder = prepPlaceholder({ value: pattern, alias, ctx })
    let sql = `CONCAT_WS(${patternPlaceholder}, `

    if (isVariable(patternPlaceholder)) {
        const patternName = prepName({ alias, value: pattern })
        values.push(patternName)
    }

    sql += value.map(v => {
        if (typeof v === 'object') {
            const resp = prepWhere({ alias, where: v, junction, encryption, ctx })
            values.push(...resp.values)
            return resp.sql
        } else {
            const valuePlaceholder = prepPlaceholder({ value: v, alias, ctx })
            if (isVariable(valuePlaceholder)) {
                const valueName = prepName({ alias, value: v })
                values.push(valueName)
            }
            return valuePlaceholder
        }
    }).join(', ')

    sql += ')'

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length && as) {
        sql += ` AS ${(ctx?.config?.dialect === 'mysql' ? '?' : as)}`
        if (ctx?.config?.dialect === 'mysql') values.push(as)
    }

    return { sql, values }

}

/**
 * performs various string based operations on the 'value' property
 * @function prepString
 * @param {Object} strParam
 * @param {string} [strParam.alias] (optional) alias reference for the table name
 * @param {import("../defs/types").StringObject} strParam.val object that holds values for different properties
 * @param {import("../defs/types").EncryptionConfig} [strParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [strParam.ctx]
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepString = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const { value, replace = null, reverse = false, textCase = null, padding = {}, substr = null, trim = false, cast = null, decrypt = null, encrypt = null, encoding = 'utf8mb4', as = null, compare = {} } = val

    let sql = ''
    const values = []

    // prepare place holder
    const placeholder = prepPlaceholder({ value, alias, ctx })
    // patch placeholder to the sql string
    sql += placeholder
    if (isVariable(placeholder)) {
        const name = prepName({ alias, value })
        values.push(name)
    }

    // envelop decrypt
    const decryptResp = prepDecryption({ placeholder, value, decrypt, encoding, encryption, ctx })
    console.log('decryptResp', decryptResp)
    sql = decryptResp.sql
    values.push(...decryptResp.values)

    // const enc = {}
    // if (encrypt) {
    //     enc[value] = encrypt
    //     console.log('encrypt after mutation', enc)
    // }
    
    // const encResp = prepEncryption({ placeholder: decryptResp.sql, col: value, encrypt: enc, ctx, encryption })
    // console.log('encResp', encResp)
    // sql = encResp.sql
    // values.push(...encResp.values)
    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    // trim
    if (trim === 'left') sql = `LTRIM(${sql})`
    else if (trim === 'right') sql = `RTRIM(${sql})`
    else if (trim === true) sql = `TRIM(${sql})`

    // substring extras
    if (!!substr) {

        // handle if substr length is missing
        if (!substr?.length) {
            throw { message: `[Missing]: Sub-string 'length' is missing!`, cause: "Missing 'length' property inside substr" }
        }
        // handle if substr start index is missing
        if (!substr?.start) {
            throw { message: `[Missing]: Sub-string 'start' index is missing!`, cause: "Missing 'start' property inside substr" }
        }

        sql = `SUBSTR(${sql}, ${prepPlaceholder({ value: substr?.start, ctx })}, ${prepPlaceholder({ value: substr?.length, ctx })})`
        values.push(substr?.start, substr?.length)
    }

    // apply right padding (extras)
    if (padding?.right) {
        // handle if padding length is missing
        if (!padding?.right?.length) {
            throw { message: `[Missing]: Right padding 'length' is required!`, cause: "Missing 'length' property inside padding right" }
        }
        // handle if padding pattern is missing
        if (!padding?.right?.pattern) {
            throw { message: `[Missing]: Right padding 'pattern' is required!`, cause: "Missing 'pattern' property inside padding right" }
        }
        sql = `RPAD(${sql} ${ctx?.config?.dialect === 'postgresql' ? `, $${ctx._variableCount++}, $${ctx._variableCount++}` : ', ?, ?'})`
        values.push(padding?.right?.length, padding?.right?.pattern)
    }

    // apply left padding (extras)
    if (padding?.left) {
        // handle if padding length is missing
        if (!padding?.left?.length) {
            throw { message: `[Missing]: Left padding 'length' is required!`, cause: "Missing 'length' property inside padding left" }
        }
        // handle if padding pattern is missing
        if (!padding?.left?.pattern) {
            throw { message: `[Missing]: Left padding 'pattern' is required!`, cause: "Missing 'pattern' property inside padding left" }
        }
        sql = `LPAD(${sql} ${ctx?.config?.dialect === 'postgresql' ? `, $${ctx._variableCount++}, $${ctx._variableCount++}` : ', ?, ?'})`
        values.push(padding?.left?.length, padding?.left?.pattern)
    }

    // text case ends here
    if (textCase === 'lower') sql = `LOWER(${sql})`
    else if (textCase === 'upper') sql = `UPPER(${sql})`

    // handle reverse
    if (reverse) sql = `REVERSE(${sql})`

    // replace target content ends here
    if (replace != null) {
        // handle if padding length is missing
        if (!replace?.target) {
            throw { message: `[Missing]: Replace 'target' is missing!`, cause: "Missing 'target' property inside replace" }
        }
        // handle if padding pattern is missing
        if (!replace?.with) {
            throw { message: `[Missing]: Replace 'with' string is missing!`, cause: "Missing 'with' property inside replace" }
        }
        sql = `REPLACE(${sql} ${ctx?.config?.dialect === 'postgresql' ? `, $${ctx._variableCount++}, $${ctx._variableCount++}` : ', ?, ?'} )`
        values?.push(replace?.target, replace?.with)
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length && as) {
        sql += ` AS ${ctx?.config?.dialect === 'mysql' ? '?' : (as || (value.includes('.') ? value.split('.')[1] : value))}`
        if (ctx?.config?.dialect === 'mysql') values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }
    return { sql, values }
}

const dateUnits = Object.freeze({
    f: 'MICROSECOND',
    s: 'SECOND',
    i: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    m: 'MONTH',
    q: 'QUARTER',
    y: 'YEAR',
    smi: 'SECOND_MICROSECOND',
    mmi: 'MINUTE_MICROSECOND',
    ms: 'MINUTE_SECOND',
    hmi: 'HOUR_MICROSECOND',
    hs: 'HOUR_SECOND',
    hm: 'HOUR_MINUTE',
    dmi: 'DAY_MICROSECOND',
    ds: 'DAY_SECOND',
    dm: 'DAY_MINUTE',
    dh: 'DAY_HOUR',
    yM: 'YEAR_MONTH',
})


/**
 * @typedef {object} encryption
 * @prop {string} [mode] (optional) EncryptionModes,
 * @prop {string} [secret] (optional) string,
 * @prop {string} [iv] (optional) string,
 * @prop {string} [sha] (optional) EncryptionSHAs
 */

/**
 * @typedef {object} dateVal
 * @prop  {string|string[]} value name of the column or date as a string
 * @prop {number} [add] (optional) date / time to be added to the 'value' property
 * @prop {number} [sub] (optional) date / time to be subtracted from the 'value' property
 * @prop {string} [fromPattern] (optional) pattern to recognize and generate date from
 * @prop {CastingTypes} [cast] (optional) cast the decrypted 'value' property into
 * @prop {encryption} [decrypt] (optional) decryption configuration for the 'value' property
 */


/**
 * performs various date operation(s) on the value attribute
 * @function prepDate
 * @param {Object} dateObj
 * @param {string} [dateObj.alias] (optional) local reference for the table name
 * @param {'and'|'or'} [dateObj.junction]
 * @param {import("../defs/types").DateObject} dateObj.val object that holds values for different properties
 * @param {import("../defs/types").EncryptionConfig} [dateObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [dateObj.ctx] (optional) inherits class context reference from its parent level
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepDate = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    // deconstruct different props from the val object
    const { value, add = 0, sub = 0, format = null, fromPattern = null, cast = null, decrypt = null, encoding = 'utf8mb4', as = null, compare = {} } = val

    const addInterval = (add && parseFloat(add)) || null
    const subInterval = (sub && parseFloat(sub)) || null
    const addUnit = (add && typeof add === 'string' && add?.match(/[a-z]+/ig)) || null
    const subUnit = (sub && typeof sub === 'string' && sub?.match(/[a-z]+/ig)) || null

    // init local sql string and values array
    let sql = ''
    const values = []

    // extract placeholder
    const placeholder = prepPlaceholder({ value, alias, ctx })

    // patch placeholder to the sql string
    sql += placeholder
    // patch value to values array (conditional)
    if (isVariable(placeholder)) {
        // prepare name
        const name = prepName({ alias, value })
        values.push(name)
    }

    // decrypt
    const decryptResp = prepDecryption({ placeholder, value, decrypt, encryption, encoding, ctx })
    sql = decryptResp.sql
    values.push(...decryptResp.values)

    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    // create date from string pattern
    if (fromPattern) {
        sql += `STR_TO_DATE(${sql}, ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'})`
        values.push(fromPattern)
    }

    // add date/time
    if (addInterval) {
        sql = `ADDDATE(${sql}`
        if (!addUnit) {
            sql += `, ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'})`
        }
        else if (!dateUnits[addUnit]) {
            throw { message: 'Invalid date / time unit provided!', cause: 'Unit value provided is invalid!' }
        } else {
            sql += `, INTERVAL ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'} ${dateUnits[addUnit]})`
        }
        values.push(addInterval)
    }

    // sub date/time
    if (subInterval) {
        sql = `SUBDATE(${sql}`
        if (!subUnit) {
            sql += `, ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'})`
        } else if (!dateUnits[subUnit]) {
            throw { message: 'Invalid date / time unit provided!', cause: 'Unit value provided is invalid!' }
        } else {
            sql += `, INTERVAL ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'} ${dateUnits[subUnit]})`
        }
        values.push(subInterval)
    }

    if (format) {
        sql = `DATE_FORMAT(${sql}, ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'})`
        values.push(format)
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length && as) {
        sql += ' AS ' + (ctx?.config?.dialect === 'mysql' ? '?' : (as || (value.includes('.') ? value.split('.')[1] : value)))
        if (ctx?.config?.dialect === 'mysql') values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }

    // return result object
    return { sql, values }
}

/**
 * performs numeric operations on the 'value' property
 * @function prepNumeric
 * @param {Object} numObj
 * @param {string} [numObj.alias] (optional) alias reference for the table name
 * @param {'and'|'or'} [numObj.junction]
 * @param {import("../defs/types").NumericObject} numObj.val
 * @param {import("../defs/types").EncryptionConfig} [numObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [numObj.ctx]
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
*/
const prepNumeric = ({ alias, val, junction = 'and', encryption, ctx = 0 }) => {

    const values = []
    let sql = ''

    const { value, decimals = null, mod = null, sub = 0, add = 0, multiplyBy = null, divideBy = null, power = null, cast = null, decrypt = null, encoding = 'utf8mb4', as = null, compare = {} } = val

    // patch placeholder to the sql string
    const placeholder = prepPlaceholder({ value, alias, ctx })
    // patch placeholder to the sql string
    sql += placeholder
    if (isVariable(placeholder)) {
        const name = prepName({ alias, value })
        values.push(name)
    }

    // envelop decrypt
    const decryptResp = prepDecryption({ placeholder, value, decrypt, encoding, encryption, ctx })
    sql = decryptResp.sql
    values.push(...decryptResp.values)

    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    // apply power
    if (power != null) {
        const powPlaceholder = prepPlaceholder({ value: power, alias, ctx })
        sql = `POWER(${sql}, ${powPlaceholder})`
        if (isVariable(powPlaceholder)) {
            const powName = prepName({ alias, value: power })
            values.push(powName)
        }
    }

    // apply division
    if (divideBy != null) {
        const divisorPlaceholder = prepPlaceholder({ value: divideBy, alias, ctx })
        sql = `(${sql} / ${divisorPlaceholder})`
        if (isVariable(divisorPlaceholder)) {
            const divisorName = prepName({ alias, value: divideBy })
            values.push(divisorName)
        }
    }

    // apply modulus
    if (mod != null) {
        const modPlaceholder = prepPlaceholder({ value: mod, alias, ctx })
        sql = `(${sql} MOD ${modPlaceholder})`
        if (isVariable(modPlaceholder)) {
            const modName = prepName({ alias, value: mod })
            values.push(modName)
        }
    }

    // apply multiplier
    if (multiplyBy != null) {
        const multiplierPlaceholder = prepPlaceholder({ value: multiplyBy, alias, ctx })
        sql = `(${sql} * ${multiplierPlaceholder})`
        if (isVariable(multiplierPlaceholder)) {
            const multiplierName = prepName({ alias, value: multiplyBy })
            values.push(multiplierName)
        }
    }

    // apply addition
    if (add != null) {
        const addPlaceholder = prepPlaceholder({ value: add, alias, ctx })
        sql = `(${sql} + ${addPlaceholder})`
        if (isVariable(addPlaceholder)) {
            const addName = prepName({ alias, value: add })
            values.push(addName)
        }
    }

    // apply subtraction
    if (sub != null) {
        const subPlaceholder = prepPlaceholder({ value: sub, alias, ctx })
        sql = `(${sql} - ${subPlaceholder})`
        if (isVariable(subPlaceholder)) {
            const subName = prepName({ alias, value: sub })
            values.push(subName)
        }
    }

    // apply decimal format
    if (decimals === 'ceil') sql = `CEIL(${sql})`
    else if (decimals === 'floor') sql = `FLOOR(${sql})`
    else if (decimals === 'round') sql = `ROUND(${sql})`
    else if (typeof decimals === 'number') {
        sql = `FORMAT(${sql}, ${ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'})`
        values.push(decimals)
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length && as) {
        sql += ` AS ${ctx?.config?.dialect === 'mysql' ? '?' : (as || (value.includes('.') ? value.split('.')[1] : value))}`
        if (ctx?.config?.dialect === 'mysql') values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }

    return { sql, values }
}

/**
 * patches group by clause
 * @function patchGroupBy
 * @param {Object} options
 * @param {Array} options.groupBy
 * @param {string} [options.alias]
 * @param {*} [options.ctx]
 * @returns {{sql:string, values:Array}}
 */
const patchGroupBy = ({ groupBy, alias, ctx }) => {

    let sql = ''
    const values = []
    if (groupBy?.length) {
        sql += ' GROUP BY '
        sql += groupBy.map(gb => {
            const col = prepName({ value: gb, alias })
            if (ctx?.config?.dialect === 'mysql') {
                values.push(col)
                return '??'
            }
            return col
        }).join(', ')
    }
    return { sql, values }
}

const orderDirections = Object.freeze({ asc: 'ASC', desc: 'DESC' })

/**
 * patches order by clause
 * @function prepOrderBy
 * @param {Object} options
 * @param {{[column:string]:'asc'|'desc'}} options.orderBy
 * @param {string} [options.alias]
 * @param {*} [options.ctx]
 * @returns {{sql:string, values:Array}}
 */
const prepOrderBy = ({ alias, orderBy, ctx }) => {
    const values = []
    let sql = ''
    if (!Object.keys(orderBy).length) return { sql, values }
    sql = ' ORDER BY ' + Object.entries(orderBy).map(([col, dir]) => {
        const name = prepName({ alias, value: col })
        const order = orderDirections[dir]
        if (ctx?.config?.dialect === 'mysql') {
            values.push(name)
            return `?? ${order}`
        }
        return `${name} ${order}`
    }).join(', ')

    return { sql, values }
}

/**
 * checks if placeholder is variable or not
 * @function isVariable
 * @param {*} value 
 * @returns {boolean}
 */
const isVariable = value => (value.startsWith('$') || value.startsWith('#') || value === '?' || value === '??') && !checkConstants(value)

// working but when json_agg, it requires columns to be in group by
const generateJsonbObject = (value, ctx, keyType = 'json') => {
    const values = []
    if (value == null) return { sql: 'NULL', values }
    if (typeof value === 'function') throw new Error('Invalid value type')

    const wrapPlaceholder = (val, cast) => {
        values.push(val)
        return `$${ctx._variableCount++}::${cast}`
    }

    const processValue = (val) => {
        if (val == null) return 'NULL'
        if (typeof val === 'function') throw new Error('Invalid value type')
        if (typeof val === 'string') return val.startsWith('#') ? wrapPlaceholder(val.slice(1), 'text') : val
        const typeMap = { number: val => wrapPlaceholder(val, Number.isInteger(val) ? 'int' : 'numeric'), boolean: val => wrapPlaceholder(val, 'boolean') }
        if (typeMap[typeof val]) return typeMap[typeof val](val)
        if (Array.isArray(val)) return `jsonb_build_array(${val.map(processValue).join(', ')})`
        if (typeof val === 'object') return `jsonb_build_object(${Object.entries(val).map(([k, v]) => `'${k}', ${processValue(v)}`).join(', ')})`
        throw new Error('Unsupported value type')
    }

    if (keyType === 'array') {
        if (Array.isArray(value)) return { sql: `jsonb_build_array(${value.map(processValue).join(', ')})`, values }
        if (typeof value === 'object') return { sql: `json_agg(${processValue(value)})`, values }
    }

    return { sql: processValue(value), values }
}

const prepJsonExtract = (jsonRef, extract, ctx) => {
    const values = []
    let sql = ''
    if (!extract) return { sql: jsonRef, values }
    if (ctx?.config?.dialect === 'postgresql') {
        sql = `${jsonRef}`
        extract = extract.replace('[', '.').replace(']', '')
        if (extract.startsWith('.')) extract = extract.substring(1)
        if (extract.includes('.')) {
            sql += `#>$` + ctx._variableCount++
            values.push(`{${extract.replace('.', ',')}}`)
        } else {
            sql += `->$${ctx._variableCount++}`
            values.push(extract)
        }
    } else {
        sql = `JSON_EXTRACT(${jsonRef}, ?)`
        if (typeof extract === 'number') values.push(`$[${extract}]`)
        else if (typeof extract === 'string' && extract.startsWith('[')) values.push(`$${extract}`)
        else values.push('$.' + extract)
    }
    return { sql, values }
}

const prepJsonContains = (jsonRef, contains, ctx) => {
    console.log('prepJsonContains invoked')
    if (!contains) return { sql: jsonRef, values: [] }
    if (ctx?.config?.dialect === 'mysql')
        return { sql: `JSON_CONTAINS(${jsonRef}, ?)`, values: [JSON.stringify(contains)] }
    else if (ctx?.config?.dialect === 'postgresql') {
        return { sql: `${jsonRef}@>$${ctx._variableCount++}`, values: [JSON.stringify(contains)] }
    } else {
        throw { message: `Feature to check if json array 'contains' a 'value' is not supported by '${ctx?.config?.dialect}'`, cause: `Not all Json features are supported by '${ctx?.config?.dialect}'` }
    }
}

const prepEncryption = ({ placeholder, col, encrypt = {}, encryption, ctx }) => {
    let sql = ''
    const values = []

    if (!encrypt[col]) return { sql: placeholder, values }

    const config = { ...(ctx?.config?.encryption || {}), ...(encryption || {}), ...(encrypt[col] || {}) }
    console.log('config', config)
    const modes = ['aes-128-ecb', 'aes-256-cbc']

    // validate encryption mode
    if (config?.mode && !modes.includes(config?.mode?.toLowerCase())) {
        throw { message: `[Invalid]: Encryption mode '${config?.mode}' provided for column: '${col}'`, cause: 'Invalid encryption mode' }
    }

    // check secret exists or not
    if (!config?.secret) throw { message: `[Missing]: Secret key is required for encryption of column: '${col}'`, cause: 'Secret key is missing' }

    if (ctx?.config?.dialect === 'mysql') {
        // check iv (in 'cbc' mode) exists or not
        if (!config.iv && config?.mode.includes('cbc')) throw { message: `[Missing]: Initialization Vector (iv) is required (in '${config?.mode}') for encryption of column: '${col}'`, cause: 'Initialization Vector (iv) is missing' }
        sql = `AES_ENCRYPT(${placeholder} ${config?.mode?.includes('cbc') ? ', ?' : ''}, UNHEX(SHA2(?, ?)))`
        values.push(config?.secret)
        if (config?.mode?.includes('cbc')) values.push(config?.iv)
        values.push(config?.sha || 512)
        return { sql, values }
    } else if (ctx?.config?.dialect === 'postgresql') {
        sql = `pgp_sym_encrypt(${placeholder}, $${ctx._variableCount++}, $${ctx._variableCount++})`
        values.push(config?.secret)
        values.push('compress-algo=1, cipher-algo=' + (config?.mode || 'aes256').toLowerCase().replace('-cbc', '').replace('-', ''))
        return { sql: result, values }
    } else {
        throw { message: `[Invalid]: No built-in AES Encryption support found for '${ctx?.config?.dialect}'`, cause: `AES Encryption not supported by '${ctx?.config?.dialect}'` }
    }
}

const prepDecryption = ({ placeholder, value, decrypt, encoding, encryption, ctx }) => {

    let sql = ''
    const values = []

    if (!decrypt) return { sql: placeholder, values }

    const config = { ...(decrypt || {}), ...(encryption || {}), ...(ctx?.config?.encryption) }
    const modes = ['aes-128-ecb', 'aes-256-cbc']

    // validate encryption mode
    if (config?.mode && !modes.includes(config?.mode?.toLowerCase())) {
        throw { message: `[Invalid]: Encryption mode '${config?.mode}' provided for column: '${value}'`, cause: 'Invalid encryption mode' }
    }

    // check secret exists or not
    if (!config?.secret) throw { message: `[Missing]: Secret key is required to decrypt column: '${value}'`, cause: 'Secret key is missing' }

    if (ctx?.config?.dialect === 'mysql') {
        // check iv (in 'cbc' mode) exists or not
        if (!config.iv && config?.mode.includes('cbc')) throw { message: `[Missing]: Initialization Vector (iv) is required (in '${config?.mode}') to decrypt column: '${value}'`, cause: 'Initialization Vector (iv) is missing' }
        sql = `CONVERT(AES_DECRYPT(${placeholder} ${config?.mode?.includes('cbc') ? ', ?' : ''}, UNHEX(SHA2(?, ?))) USING ${encoding})`
        values.push(config?.secret)
        if (config?.mode?.includes('cbc')) values.push(config?.iv)
        values.push(config?.sha || 512)
        return { sql, values }
    } else if (ctx?.config?.dialect === 'postgresql') {
        sql = `COALESCE(NULLIF(pgp_sym_decrypt(${placeholder}, $${ctx._variableCount++}, $${ctx._variableCount++}), ''), '')`;
        values.push(config?.secret)
        values.push('compress-algo=1, cipher-algo=' + (config?.mode || 'aes256').toLowerCase().replace('-cbc', '').replace('-', ''))
        return { sql, values }; // Return the query string
    } else {
        throw { message: `[Invalid]: No built-in AES Decryption support found for '${ctx?.config?.dialect}'`, cause: `AES Decryption not supported by '${ctx?.config?.dialect}'` }
    }
}

/**
 * patch limit/offset
 * @function patchLimit
 * @param {number} [limit] 
 * @param {*} ctx 
 * @param {'LIMIT'|'OFFSET'} [key=LIMIT] 
 * @returns {{sql:string, values:Array}}
 */
const patchLimit = (limit, ctx, key = 'LIMIT') => typeof limit === 'number' ? ({ sql: ` ${key} ` + ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?', values: [limit] }) : { sql: '', values: [] }

module.exports = { prepSelect, prepWhere, prepJoin, prepOrderBy, isVariable, patchGroupBy, patchLimit, prepEncryption }