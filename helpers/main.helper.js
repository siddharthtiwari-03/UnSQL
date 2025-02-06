const { colors } = require("./console.helper")
const { checkConstants, dataTypes, aggregateFunctions } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

const junctions = {
    and: ' AND ',
    or: ' OR ',
}

const conditions = {
    eq: ' = ',
    gt: ' > ',
    lt: ' < ',
    gtEq: ' >= ',
    ltEq: ' <= ',
    notEq: ' != ',
    isNull: ' IS NULL',
    like: ' LIKE ',
    startLike: ' LIKE ',
    endLike: ' LIKE ',
    notStartLike: ' NOT LIKE ',
    notEndLike: ' NOT LIKE ',
    notLike: ' NOT LIKE ',
    in: ' IN ',
    notIn: ' NOT IN '
}

const joinTypes = {
    left: 'LEFT',
    right: 'RIGHT',
    inner: 'INNER',
    outer: 'OUTER',
    cross: 'CROSS'
}

/**
 * prepares select query using various 
 * @function prepSelect
 * @param {object} selectParam
 * @param {string} [selectParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").SelectObject} selectParam.select array of columns / values / wrapper methods
 * @param {import("../defs/types").EncryptionConfig} [selectParam.encryption] (optional) query level encryption configuration
 * @param {object} [selectParam.ctx] (optional) context reference of the parent model class
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

        const placeholder = prepPlaceholder(selectable)

        const name = prepName({ alias, value: selectable })

        if (!checkConstants(selectable)) values.push(name)

        return placeholder
    }).join(', ')

    return { sql, values }

}

/**
 * prepares where statement
 * @function prepWhere
 * @param {object} whereParam
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
                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                }

                sql += ' BETWEEN '

                if (typeof gt === 'object') {
                    const gtResp = prepWhere({ alias, where: gt, junction, encryption, ctx })
                    sql += gtResp.sql
                    values.push(...gtResp.values)
                } else {
                    const gtPlaceholder = prepPlaceholder(gt)
                    const gtName = prepName({ alias, value: gt })
                    sql += gtPlaceholder
                    if (!checkConstants(gt)) values.push(gtName)
                }

                sql += ' AND '

                if (typeof lt === 'object') {
                    const ltResp = prepWhere({ alias, where: lt, junction, encryption, ctx })
                    sql += ltResp.sql
                    values.push(...ltResp.values)
                } else {
                    const ltPlaceholder = prepPlaceholder(lt)
                    const ltName = prepName({ alias, value: lt })
                    sql += ltPlaceholder
                    if (!checkConstants(lt)) values.push(ltName)
                }
                break
            }

            case key === 'decrypt': {
                const { value, compare, secret, iv, sha, cast = 'char' } = val

                if (parent && !(parent in conditions)) {
                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                    sql += ' = '
                }

                if (typeof value === 'object') {
                    const resp = prepWhere({ alias, where: value, parent, junction, encryption, ctx })
                    sql += resp.sql
                    values.push(...resp.values)
                    break
                }

                sql += 'CAST(AES_DECRYPT(??'
                values.push(value)

                if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
                    sql += ', ?'
                }

                sql += `, UNHEX(SHA2(?, ?))) AS ${dataTypes[cast]})` // AES method ends here

                values.push(secret || encryption?.secret || ctx?.config?.encryption?.secret)

                if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
                    if (!iv && !encryption?.iv && !ctx?.config?.encryption?.iv) {
                        console.error(colors.red, 'Initialization Vector (iv) is required to decrypt', colors.reset)
                        throw new Error('Initialization Vector (iv) is required to decrypt!', { cause: 'Missing "iv" to decrypt inside date wrapper!' })
                    }
                    values.push(iv || encryption?.iv || ctx?.config?.encryption?.iv)
                }

                values.push(sha || encryption?.sha || ctx?.config?.encryption?.sha || 512)

                // cascading compare conditions
                if (compare) {
                    const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
                    values.push(...resp.values)
                    sql += resp.sql
                }
                break
            }

            case key === 'refer': {
                if (parent && !(parent in conditions)) {
                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
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

            case key in conditions: {
                if (parent && !(parent in conditions) && parent != 'from') {
                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                }

                sql += conditions[key]

                if (key === 'isNull') break

                if (key === 'in') sql += '('
                else if (key === 'like' || key === 'notLike' || key === 'endLike' || key === 'notEndLike') sql += 'CONCAT("%", '

                if (typeof val === 'object') {
                    const resp = prepWhere({ alias, where: val, parent: key, junction, encryption, ctx })
                    sql += resp.sql
                    values.push(...resp.values)
                } else {
                    const valPlaceholder = prepPlaceholder(val)
                    const valName = prepName({ alias, value: val })
                    sql += valPlaceholder
                    if (!checkConstants(val)) values.push(valName)
                }

                if (key === 'like' || key === 'notLike' || key === 'startLike' || key === 'notStartLike') sql += ' ,"%")'
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
                const keyPlaceholder = prepPlaceholder(key)
                const keyName = prepName({ alias, value: key })
                sql += keyPlaceholder
                if (!checkConstants(key)) values.push(keyName)

                sql += ' IN ('

                sql += val.map(value => {
                    const valPlaceholder = prepPlaceholder(value)
                    const valName = prepName({ alias, value })
                    if (!checkConstants(value)) values.push(valName)
                    return valPlaceholder
                }).join(', ')

                sql += ')'
                break
            }

            case typeof val === 'number':
            case typeof val === 'string': {

                const keyPlaceholder = prepPlaceholder(key)
                const keyName = prepName({ alias, value: key })

                sql += keyPlaceholder
                if (!checkConstants(key)) values.push(keyName)

                if (val === 'isNull') {
                    sql += ' ' + conditions.isNull
                    break
                }

                const valPlaceholder = prepPlaceholder(val)
                const valName = prepName({ alias, value: val })

                sql += ' = ' + valPlaceholder
                if (!checkConstants(val)) values.push(valName)

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

        const { type = null, select = [], table, alias: joinAlias = null, join: nestedJoin = [], where = {}, junction = 'and', using = [], as = null } = joinable

        if (!table) {
            console.error(colors.red, 'Table name is missing inside join', colors.reset)
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

            sql += ' FROM ?? ?? '
            if (!joinAlias) {
                console.error(colors.red, 'Missing "alias" property when using selective join association', colors.reset)
                throw new Error('Missing "alias" property with selective join association', { cause: "Missing 'alias' property inside join object with 'select' property" })
            }
            values.push(table, joinAlias)

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
 * @param jsonObj object with different properties that help generate a json object / array
 * @param {'json'|'array'} [jsonObj.key] (optional) alias reference for the table name
 * @param {{value:(object|Array), from?:string, alias?:string, where?:object, as?:string}} jsonObj.val accepts values related to sub-query
 * @param {{mode?:import("../defs/types").EncryptionModes, secret?:string, iv?:string, sha?:EncryptionSHAs}} [numObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [numObj.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJson = ({ key, val, encryption = undefined, ctx = undefined }) => {
    let sql = ''
    const values = []

    const { value, table = null, alias = null, where = {}, as = null } = val

    if (table) sql += '(SELECT '

    if (key === 'array' && !Array.isArray(value)) sql += 'JSON_ARRAYAGG('
    if (key === 'array' && Array.isArray(value)) sql += 'JSON_ARRAY('
    if (key === 'json' || !Array.isArray(value)) sql += 'JSON_OBJECT('

    sql += Object.entries(value).map(([k, v]) => {
        const vPlaceholder = prepPlaceholder(v)
        const vName = prepName({ alias, value: v })

        if (!Array.isArray(value)) values.push(k)
        if (!checkConstants(v)) values.push(vName)

        return (!Array.isArray(value) ? '?, ' : '') + vPlaceholder
    }).join(', ')

    if (key === 'json' || !Array.isArray(value)) sql += ')'
    if (key === 'array' && Array.isArray(value)) sql += ')'
    if (key === 'array' && !Array.isArray(value)) sql += ')'

    if (table) {
        sql += ' FROM ??'
        values.push(table)
        if (alias) {
            sql += ' ??'
            values.push(alias)
        }
    }

    if (Object.keys(where).length) {
        sql += ' WHERE '
        const whereResp = prepWhere({ alias, where, junction: 'and', encryption, ctx })
        sql += whereResp.sql
        values.push(...whereResp.values)
    }

    if (table) sql += ')'

    sql += ' AS ?'
    values.push(as || key)

    return { sql, values }

}

/**
 * prepares aggregate functions
 * @function prepAggregate
 * @param {object} aggParam object with different properties that help generate aggregate method
 * @param {string} [aggParam.alias] (optional) local reference name of the table
 * @param {string} aggParam.key refers the name of the aggregate method, viz. 'sum', 'avg', 'min', 'max' etc.
 * @param {{value:(import("../defs/types").ValuesObject), distinct?:boolean, cast?: import("../defs/types").CastingTypes, compare?:import("../defs/types").WhereObject, as?:string}} aggParam.val accepts values related to aggregate method
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
        const placeholder = prepPlaceholder(value)
        const name = prepName({ alias, value })
        sql += placeholder
        if (!checkConstants(value)) values.push(name)
    }

    sql += ')'

    // type casting ends here
    if (cast) sql += ` AS ${dataTypes[cast]})`

    if (as) {
        sql += ' AS ??'
        values.push(as)
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
 * @param {object} fromParam object with different properties that help generate aggregate method
 * @param {{
 * select:import("../defs/types").SelectObject, 
 * table:string, 
 * join:import("../defs/types").JoinObject, 
 * where?:import("../defs/types").WhereObject, 
 * junction?:('and'|'or'), 
 * groupBy?:string[], 
 * having?:import("../defs/types").HavingObject, 
 * orderBy?:object, 
 * limit?:number, 
 * offset?:number, 
 * as?:string
 * }} jsonObj.val accepts values related to aggregate method
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepRefer = ({ val, parent = null, encryption = undefined, ctx = undefined }) => {

    const { select = ['*'], table, alias = null, join = [], where = {}, junction = 'and', groupBy = [], having = [], orderBy = {}, limit = null, offset = null, as = null } = val

    let sql = ''

    const values = []

    sql += '(SELECT '

    const selectResp = prepSelect({ alias, select, encryption, ctx })

    sql += selectResp.sql
    values.push(...selectResp.values)

    sql += ' FROM ??'
    values.push(table)

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
            values.push(gb.includes('.') ? gb : ((alias && (alias + '.')) + gb))
            return '??'
        }).join(', ')
    }

    if (having.length) {
        sql += 'HAVING '
        const havingResp = prepWhere({ alias, where: having, junction, encryption, ctx })
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

    sql += ')'

    if (as) {
        sql += ' AS ??'
        values.push(as)
    }

    return { sql, values }

}

/**
 * prepares if else condition
 * @function prepIf
 * @param {object} ifParam
 * @param {string} [ifParam.alias] (optional) local reference name of the table
 * @param {{
 * check:*,
 * trueValue: *,
 * falseValue: *,
 * as?: string
 * }} ifParam.val
 * @param {'and'|'or'}  [ifParam.junction] (optional) clause used to join conditions
 * @param {import("../defs/types").EncryptionConfig} [ifParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [caseParam.ctx] context reference to parent class
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
        const ifPlaceholder = prepPlaceholder(check)
        const ifName = prepName({ alias, value: check })
        sql += ifPlaceholder
        if (!checkConstants(ifPlaceholder)) values.push(ifName)
    }

    sql += ', '

    if (typeof trueValue === 'object') {
        const trueResp = prepWhere({ alias, where: trueValue, junction, encryption, ctx })
        sql += trueResp.sql
        values.push(...trueResp.values)
    } else {
        const truePlaceholder = prepPlaceholder(trueValue)
        const trueName = prepName({ alias, value: trueValue })

        sql += truePlaceholder
        if (!checkConstants(trueValue)) values.push(trueName)
    }
    sql += ', '

    if (typeof falseValue === 'object') {
        const falseResp = prepWhere({ alias, where: falseValue, junction, encryption, ctx })
        sql += falseResp.sql
        values.push(...falseResp.values)
    } else {
        const falsePlaceholder = prepPlaceholder(falseValue)
        const falseName = prepName({ alias, value: falseValue })

        sql += falsePlaceholder + ')'
        if (!checkConstants(falseValue)) values.push(falseName)
    }

    if (as) {
        sql += ' AS ?'
        values.push(as)
    }

    return { sql, values }
}

/**
 * prepares switch case
 *@function prepCase
 @param caseParam
 @param {string} [caseParam.alias] (optional) local reference to table name
 @param {{check: Array, else: *, as?: string}} caseParam.val
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

        sql += 'WHEN '
        if (typeof when === 'object') {
            const whenResp = prepWhere({ alias, where: when, junction, encryption, ctx })
            sql += whenResp.sql
            values.push(...whenResp.values)
        } else {
            const whenPlaceholder = prepPlaceholder(when)
            const whenName = prepName({ alias, value: when })
            sql += whenPlaceholder
            if (!checkConstants(when)) values.push(whenName)
        }

        sql += ' THEN '
        if (typeof then === 'object') {
            const thenResp = prepWhere({ alias, where: then, junction, encryption, ctx })
            sql += thenResp.sql
            values.push(...thenResp.values)
        } else {
            const thenPlaceholder = prepPlaceholder(then)
            const thenName = prepName({ alias, value: then })
            sql += thenPlaceholder
            if (!checkConstants(then)) values.push(thenName)
        }

    }).join(' ')

    sql += 'ELSE '

    const elsePlaceholder = prepPlaceholder(defaultElse)
    const elseName = prepName({ alias, value: defaultElse })

    sql += elsePlaceholder
    if (!checkConstants(defaultElse)) values.push(elseName)

    sql += 'END'

    if (as) {
        sql += ' AS ?'
        values.push(as)
    }
    return { sql, values }
}

/**
 * concat values
 * @function prepConcat
 * @param {object} concatParam
 * @param {string} [concatParam.alias] (optional) local reference to table name
 * @param {{
 * value: (import("../defs/types").ValuesObject|import("../defs/types").WrapperMethods)[]>,
 * pattern: (string|number|boolean),
 * compare?: import("../defs/types").WhereObject,
 * as?: string}} concatParam.val
 * @param {import("../defs/types").EncryptionConfig} [concatParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [concatParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepConcat = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const { value = [], pattern = '', as = null } = val

    const values = []
    let sql = 'CONCAT_WS('

    const patternPlaceholder = prepPlaceholder(pattern)
    const patternName = prepName({ alias, value: pattern })

    sql += patternPlaceholder + ', '
    if (!checkConstants(pattern)) values.push(patternName)

    sql += value.map(v => {
        if (typeof v === 'object') {
            const resp = prepWhere({ alias, where: v, junction, encryption, ctx })
            values.push(...resp.values)
            return resp.sql
        } else {
            const valuePlaceholder = prepPlaceholder(v)
            const valueName = prepName({ alias, value: v })
            if (!checkConstants(v)) values.push(valueName)
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
        sql += ' AS ?'
        values.push(as)
    }

    return { sql, values }

}

/**
 * performs various string based operations on the 'value' property
 * @function prepString
 * @param {object} strObj
 * @param {string} [strObj.alias] (optional) alias reference for the table name
 * @param {import("../defs/types").stringObject} strObj.val object that holds values for different properties
 * @param {import("../defs/types").EncryptionConfig} [strObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [strObj.ctx]
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepString = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const { value, replace = null, reverse = false, textCase = null, padding = {}, substr = null, trim = false, cast = null, decrypt = null, as = null, compare = {} } = val

    let sql = ''
    const values = []

    // replace target content
    if (replace) sql += 'REPLACE('

    // reverse the output string
    if (reverse) sql += 'REVERSE('

    // change text case
    if (textCase === 'lower') sql += 'LOWER('
    else if (textCase === 'upper') sql += 'UPPER('

    // apply padding
    if (padding?.left) sql += 'LPAD('
    if (padding?.right) sql += 'RPAD('

    // substring
    if (substr) sql += 'SUBSTR('

    // trim whitespace
    if (trim === 'left') sql += 'LTRIM('
    else if (trim === 'right') sql += 'RTRIM('
    else if (trim === true) sql += 'TRIM('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // prepare place holder
    const placeholder = prepPlaceholder(value)

    // patch placeholder to the sql string
    sql += placeholder
    // patch value to values array (conditional)
    if (!checkConstants(value)) {
        const name = prepName({ alias, value })
        values.push(name)
    }

    // patch decryption extras if required
    if (decrypt) {

        const decryptResp = prepDecrypt({ decrypt, encryption, ctx })

        sql += decryptResp.sql

        values.push(...decryptResp.values)

    }
    // decrypt ends here

    // type casting ends here
    if (cast || decrypt) sql += ' AS ' + (dataTypes[cast] || 'CHAR') + ')'

    // trim ends here
    if (trim === 'left' || trim === 'right' || trim === true) sql += ')'

    // substring extras
    if (substr) {
        // handle if substr length is missing
        if (!substr?.length) {
            console.error(colors.red, 'Sub-string length is missing!', colors.reset)
            throw new Error('Sub-string length is missing!', { cause: "Missing 'length' property inside substr" })
        }
        // handle if substr start index is missing
        if (!substr?.start) {
            console.error(colors.red, 'Sub-string start index is missing!', colors.reset)
            throw new Error('Sub-string start index is missing!', { cause: "Missing 'start' property inside substr" })
        }

        sql += ', ? ,?)'
        values.push(substr?.start, substr?.length)
    }

    // apply right padding (extras)
    if (padding?.right) {
        sql += ', ?, ?)'
        // handle if padding length is missing
        if (!padding?.right?.length) {
            console.error(colors.red, 'Right padding length is missing!', colors.reset)
            throw new Error('Right padding length is missing!', { cause: "Missing 'length' property inside padding right" })
        }
        // handle if padding pattern is missing
        if (!padding?.right?.pattern) {
            console.error(colors.red, 'Right padding pattern is missing!', colors.reset)
            throw new Error('Right padding pattern is missing!', { cause: "Missing 'pattern' property inside padding right" })
        }
        values.push(padding?.right?.length, padding?.right?.pattern)
    }

    // apply left padding (extras)
    if (padding?.left) {
        sql += ', ?, ?)'
        // handle if padding length is missing
        if (!padding?.left?.length) {
            console.error(colors.red, 'Left padding length is missing!', colors.reset)
            throw new Error('Left padding length is missing!', { cause: "Missing 'length' property inside padding left" })
        }
        // handle if padding pattern is missing
        if (!padding?.left?.pattern) {
            console.error(colors.red, 'Left padding pattern is missing!', colors.reset)
            throw new Error('Left padding pattern is missing!', { cause: "Missing 'pattern' property inside padding left" })
        }
        values.push(padding?.left?.length, padding?.left?.pattern)
    }

    // text case ends here
    if (textCase === 'lower' || textCase === 'upper') sql += ')'

    // reverse ends here
    if (reverse) sql += ')'

    // replace target content ends here
    if (replace) {
        // handle if padding length is missing
        if (!replace?.target) {
            console.error(colors.red, 'Replace target is missing!', colors.reset)
            throw new Error('Replace target is missing!', { cause: "Missing 'target' property inside replace" })
        }
        // handle if padding pattern is missing
        if (!padding?.right?.pattern) {
            console.error(colors.red, 'Replace with string is missing!', colors.reset)
            throw new Error('Replace with string is missing!', { cause: "Missing 'with' property inside replace" })
        }
        sql += ', ?, ?)'
        values?.push(replace?.target, replace?.with)
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length && as) {
        sql += ' AS ?'
        values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }
    return { sql, values }

}

const dateUnits = {
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
}


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
 * @param {object} dateObj
 * @param {string} [dateObj.alias] (optional) local reference for the table name
 * @param {'and'|'or'} [dateObj.junction]
 * @param {import("../defs/types").dateObject} dateObj.val object that holds values for different properties
 * @param {import("../defs/types").EncryptionConfig} [dateObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [dateObj.ctx] (optional) inherits class context reference from its parent level
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepDate = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    // deconstruct different props from the val object
    const { value, add = 0, sub = 0, format = null, fromPattern = null, cast = null, decrypt = null, as = null, compare = {} } = val

    const addInterval = (add && parseFloat(add)) || null
    const subInterval = (sub && parseFloat(sub)) || null
    const addUnit = (add && typeof add === 'string' && add?.match(/[a-z]+/ig)) || null
    const subUnit = (sub && typeof sub === 'string' && sub?.match(/[a-z]+/ig)) || null

    // init local sql string and values array
    let sql = ''
    const values = []

    // format date
    if (format) sql += 'DATE_FORMAT('

    // subtract date / time
    if (subInterval) sql += 'SUBDATE('

    // add date / time
    if (addInterval) sql += 'ADDDATE('

    // create date from string pattern
    if (fromPattern) sql += 'STR_TO_DATE('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // extract placeholder
    const placeholder = prepPlaceholder(value)

    // patch placeholder to the sql string
    sql += placeholder
    // patch value to values array (conditional)
    if (!checkConstants(value)) {
        // prepare name
        const name = prepName({ alias, value })
        values.push(name)
    }

    // patch decryption extras if required
    if (decrypt) {

        const decryptResp = prepDecrypt({ decrypt, encryption, ctx })

        sql += decryptResp.sql

        values.push(...decryptResp.values)

    }
    // decrypt ends here

    // type casting ends here
    if (cast || decrypt) sql += ' AS ' + (dataTypes[cast] || 'CHAR') + ')'

    // patch string to date pattern
    if (fromPattern) {
        sql += ', ?)'
        values.push(fromPattern)
    }

    // patching if addInterval is provided
    if (addInterval) {

        if (!addUnit) {
            sql += ', ?)'
        }
        else if (!dateUnits[addUnit]) {
            console.error(colors.red, 'Invalid date / time unit provided', colors.reset)
            throw new Error('Invalid date / time unit provided!', { cause: 'Unit value provided is invalid!' })
        }
        else {
            sql += ', INTERVAL ? ' + dateUnits[addUnit] + ')'
        }

        values.push(addInterval)

    }

    // patching if subInterval is provided
    if (subInterval) {

        if (!subUnit) sql += ', ?)'

        else if (!dateUnits[subUnit]) {
            console.error(colors.red, 'Invalid date / time unit provided', colors.reset)
            throw new Error('Invalid date / time unit provided!', { cause: 'Unit value provided is invalid!' })
        }

        else sql += ', INTERVAL ? ' + dateUnits[subUnit] + ')'

        values.push(subInterval)

    }

    if (format) {
        sql += ', ?)'
        values.push(format)
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }


    if (!Object.keys(compare).length && as) {
        sql += ' AS ?'
        values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }

    // return result object
    return { sql, values }
}


/**
 * performs numeric operations on the 'value' property
 * @function prepNumeric
 * @param {object} numObj
 * @param {string} [numObj.alias] (optional) alias reference for the table name
 * @param {'and'|'or'} [numObj.junction]
 * @param {import("../defs/types").numericObject} numObj.val
* 
* @param {import("../defs/types").EncryptionConfig} [numObj.encryption] (optional) inherits encryption config from its parent level
* 
* @param {*} [numObj.ctx]
* 
* @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
*/
const prepNumeric = ({ alias, val, junction = 'and', encryption, ctx }) => {

    const values = []
    let sql = ''

    const { value, decimals = null, mod = null, sub = 0, add = 0, multiplyBy = null, divideBy = null, power = null, cast = null, decrypt = null, as = null, compare = {} } = val

    if (decimals === 'ceil') sql += 'CEIL('
    else if (decimals === 'floor') sql += 'FLOOR('
    else if (decimals === 'round') sql += 'ROUND('
    else if (typeof decimals === 'number') sql += 'FORMAT('

    // apply subtraction bracket
    if (sub) sql += '('

    // apply addition bracket
    if (add) sql += '('

    // apply multiplier bracket
    if (multiplyBy) sql += '('

    // apply modulus bracket
    if (mod) sql += '('

    // apply division
    if (divideBy) sql += '('

    // apply power of
    if (power) sql += 'POWER('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // patch placeholder to the sql string
    const placeholder = prepPlaceholder(value)
    sql += placeholder
    // patch value to values array (conditional)
    if (!checkConstants(value)) {
        const name = prepName({ alias, value })
        values.push(name)
    }

    // patch decryption extras if required
    if (decrypt) {

        const decryptResp = prepDecrypt({ decrypt, encryption, ctx })

        sql += decryptResp.sql

        values.push(...decryptResp.values)

    }
    // decrypt ends here

    // type casting ends here
    if (cast || decrypt) sql += ' AS ' + (dataTypes[cast] || 'CHAR') + ')'

    // apply power (extras)
    if (power) {
        const powPlaceholder = prepPlaceholder(power)
        const powName = prepName({ alias, value: power })
        sql += ', ' + powPlaceholder + ')'
        if (!checkConstants(power)) values.push(powName)
    }

    // apply division (extras)
    if (divideBy) {
        const divisorPlaceholder = prepPlaceholder(divideBy)
        const divisorName = prepName({ alias, value: divideBy })
        sql += ' / ' + divisorPlaceholder + ')'
        if (!checkConstants(divideBy)) values.push(divisorName)
    }

    // apply modulus (extras)
    if (mod) {
        const modPlaceholder = prepPlaceholder(mod)
        const modName = prepName({ alias, value: mod })
        sql += ' MOD ' + modPlaceholder + ')'
        if (!checkConstants(mod)) values.push(modName)
    }

    // apply multiplier (extras)
    if (multiplyBy) {
        const multiplierPlaceholder = prepPlaceholder(multiplyBy)
        const multiplierName = prepName({ alias, value: multiplyBy })
        sql += ' * ' + multiplierPlaceholder + ')'
        if (!checkConstants(multiplyBy)) values.push(multiplierName)
    }

    // apply addition (extras)
    if (add) {
        const addPlaceholder = prepPlaceholder(add)
        const addName = prepName({ alias, value: add })
        sql += ' + ' + addPlaceholder + ')'
        if (!checkConstants(add)) values.push(addName)
    }

    // apply subtraction (extras)
    if (sub) {
        const subPlaceholder = prepPlaceholder(sub)
        const subName = prepName({ alias, value: sub })
        sql += ' - ' + subPlaceholder + ')'
        if (!checkConstants(sub)) values.push(subName)
    }

    // apply decimal format (extras)
    if (decimals) {
        if (typeof decimals === 'number') {
            sql += ', ?'
            values.push(decimals)
        }
        sql += ')'
    }

    if (Object.keys(compare).length) {
        const resp = prepWhere({ alias, where: compare, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    }

    if (!Object.keys(compare).length) {
        sql += ' AS ?'
        values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    }

    return { sql, values }
}

const prepDecrypt = ({ decrypt, encryption, ctx }) => {

    if (!decrypt?.secret && encryption?.secret && ctx?.config?.encryption?.secret) {
        console.error(colors.red, 'secret is required to decrypt', colors.reset)
        throw new Error('Secret is required to decrypt!', { cause: 'Missing "secret" to decrypt inside date wrapper!' })
    }

    let sql = ''
    const values = []

    if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
        sql += ', ?'
    }

    sql += ', UNHEX(SHA2(?, ?)))'

    values.push(decrypt?.secret || encryption?.secret || ctx?.config?.encryption?.secret)

    if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
        if (!decrypt?.iv && !encryption?.iv && !ctx?.config?.encryption?.iv) {
            console.error(colors.red, 'Initialization Vector (iv) is required to decrypt', colors.reset)
            throw new Error('Initialization Vector (iv) is required to decrypt!', { cause: 'Missing "iv" to decrypt inside date wrapper!' })
        }
        values.push(decrypt?.iv || encryption?.iv || ctx?.config?.encryption?.iv)
    }

    values.push(decrypt?.sha || encryption?.sha || ctx?.config?.encryption?.sha || 512)

    return { sql, values }
}

module.exports = { prepSelect, prepWhere, prepJoin }