const { colors } = require("./console.helper")
const { checkConstants, dataTypes, aggregateFunctions } = require("./constants.helper")
const { prepDate } = require("./date.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")
const { prepString } = require("./string.helper")

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
 * 
 * @param {object} selectParam
 * 
 * @param {string} [selectParam.alias] (optional) local reference name of the table
 * 
 * @param {Array<string|string[]|object|fromWrapper|*>} selectParam.select array of columns / values / wrapper methods
 * 
 * @param {object} [selectParam.encryption] (optional) query level encryption configuration
 * 
 * @param {object} [selectParam.ctx] (optional) context reference of the parent model class
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepSelect = ({ alias, select = [], encryption = undefined, ctx = undefined }) => {

    const values = []

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

                case key === 'from': {
                    const resp = prepFrom({ val, encryption, ctx })
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
 * 
 * @param {object} whereParam
 * 
 * @param {string} [whereParam.alias] (optional) local reference name of the table
 * 
 * @param {{[key:string]:*}} [whereParam.where] (optional) allows to filter records using various conditions
 * 
 * @param {'and'|'or'} [whereParam.junction] (optional) clause used to connect multiple where conditions
 * 
 * @param {object} [whereParam.encryption] (optional) defines query level encryption configurations
 * 
 * @param {*} [whereParam.ctx] (optional) local reference name of the table
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepWhere = ({ alias, where = {}, parent = null, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const values = []

    const entriesResp = Object.entries(where).map(([key, val]) => {

        console.log('key', key)
        console.log('val', val)
        console.log('parent', parent)

        let sql = ''

        switch (true) {

            case key === 'and':
            case key === 'or': {
                console.log(colors.green, ' key is "and" / "or"', colors.reset)

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
                console.log(colors.red, 'between key', colors.reset)
                console.log('parent', parent)


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

                console.log(colors.green, 'decrypt detected', colors.reset, val)


                const { value, compare, secret, iv, sha, cast = 'char' } = val


                if (parent && !(parent in conditions)) {

                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                    sql += ' = '

                }

                if (typeof value === 'object') {
                    console.log(colors.red, 'value is object inside decrypt', colors.reset)
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

            case key === 'from': {

                console.log(colors.green, 'key is "from"', colors.reset)

                if (parent && !(parent in conditions)) {

                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })
                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                    sql += ' = '

                }

                const resp = prepFrom({ val, parent, encryption, ctx })
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

                console.log('val inside if', val)

                const resp = prepIf({ alias, val, junction, encryption, ctx })

                sql == resp.sql
                values.push(...resp.values)
                break
            }

            case key in conditions: {
                console.group(colors.green, 'key is in conditions', colors.reset)

                if (parent && !(parent in conditions) && parent != 'from') {
                    const parentPlaceholder = prepPlaceholder(parent)
                    const parentName = prepName({ alias, value: parent })

                    sql += parentPlaceholder
                    if (!checkConstants(parent)) values.push(parentName)
                }

                sql += conditions[key]

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

                console.log(colors.yellow, 'key is in constant functions', colors.reset)

                console.log('key', key)
                console.log('val', val)
                console.log('parent', parent)

                const resp = prepAggregate({ alias, key, parent, junction, val, encryption, ctx })
                sql += resp.sql
                values.push(...resp.values)

                break
            }

            case Array.isArray(val): {
                console.log(colors.green, 'key is array "IN" condition invoked', colors.reset)

                // if (key && key != 'UnSQL_Placeholder') {
                const keyPlaceholder = prepPlaceholder(key)
                const keyName = prepName({ alias, value: key })

                sql += keyPlaceholder
                if (!checkConstants(key)) values.push(keyName)
                // }

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

                console.log(colors.green, 'val is numeric / string / static string', colors.reset)

                // if (key && key != 'UnSQL_Placeholder') {
                const keyPlaceholder = prepPlaceholder(key)
                const keyName = prepName({ alias, value: key })
                sql += keyPlaceholder
                if (!checkConstants(key)) values.push(keyName)
                // }

                const valPlaceholder = prepPlaceholder(val)
                const valName = prepName({ alias, value: val })

                sql += ' = ' + valPlaceholder
                if (!checkConstants(val)) values.push(valName)

                break
            }

            default: {
                console.log(colors.green, 'default where block', colors.reset)
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
 * 
 * @param {object} joinParam
 * 
 * @param {string} [joinParam.alias] (optional) local reference name of the table
 * 
 * @param {Array<import("../defs/types.def").joinObj>} joinParam.join array of joining conditions
 * 
 * @param {object} [joinParam.encryption] (optional) defines query level encryption configurations
 * 
 * @param {*} [joinParam.ctx] context reference to parent class
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJoin = ({ alias, join = [], encryption = undefined, ctx = undefined }) => {

    console.log('prep join invoked')

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
 * 
 * @param jsonObj object with different properties that help generate a json object / array
 * 
 * @param {'json'|'array'} [jsonObj.key] (optional) alias reference for the table name
 * 
 * @param {{value:(object|Array), from?:string, alias?:string, where?:object, as?:string}} jsonObj.val accepts values related to sub-query
 * 
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [numObj.encryption] (optional) inherits encryption config from its parent level
 * 
 * @param {*} [numObj.ctx] context reference to parent class
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJson = ({ key, val, encryption = undefined, ctx = undefined }) => {

    console.log('prep json invoked')
    console.log('key', key)
    console.log('val', val)
    let sql = ''
    const values = []

    const { value, table = null, alias = null, where = {}, as = null } = val

    if (table) sql += '(SELECT '

    if (key === 'array' && !Array.isArray(value)) sql += 'JSON_ARRAYAGG('
    if (key === 'array' && Array.isArray(value)) sql += 'JSON_ARRAY('
    if (key === 'json' || !Array.isArray(value)) sql += 'JSON_OBJECT('

    sql += Object.entries(value).map(([k, v]) => {
        console.log(colors.red, 'entries inside map', colors.reset)
        console.log('k', k)
        console.log('v', v)

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
 * 
 * @param {object} aggParam object with different properties that help generate aggregate method
 * 
 * @param {string} [aggParam.alias] (optional) local reference name of the table
 * 
 * @param {string} aggParam.key refers the name of the aggregate method, viz. 'sum', 'avg', 'min', 'max' etc.
 * 
 * @param {{value:(object|string|number), distinct?:boolean, compare?:object, as?:string}} jsonObj.val accepts values related to aggregate method
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepAggregate = ({ alias, key, val, parent = null, junction = 'and', encryption = undefined, ctx = undefined }) => {

    const values = []
    let sql = ''

    const { value, distinct = false, compare = {}, as = null } = val

    console.dir(val)

    sql += aggregateFunctions[key] + '('
    if (distinct) sql += 'DISTINCT '

    if (typeof value === 'object') {
        console.log('value is object')
        const resp = prepWhere({ alias, where: value, parent, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    } else {
        console.log('value is not object', typeof value)
        const placeholder = prepPlaceholder(value)
        const name = prepName({ alias, value })
        sql += placeholder
        if (!checkConstants(value)) values.push(name)
    }

    sql += ')'

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
 * @function prepFrom
 * 
 * @param {object} fromParam object with different properties that help generate aggregate method
 * 
 * @param {{
 * select:import("../defs/types.def").selectObj, 
 * table:string, 
 * join:Array<import("../defs/types.def").joinObj>, 
 * where?:object, 
 * junction?:('and'|'or'), 
 * groupBy?:Array, 
 * having?:import("../defs/types.def").havingObj, 
 * orderBy?:object, 
 * limit?:number, 
 * offset?:number, 
 * as?:string
 * }} jsonObj.val accepts values related to aggregate method
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepFrom = ({ val, parent = null, encryption = undefined, ctx = undefined }) => {

    const { select = ['*'], table, alias = null, join = [], where = {}, junction = 'and', groupBy = [], having = [], orderBy = {}, limit = null, offset = null, as = null } = val

    let sql = ''

    const values = []

    sql += '(SELECT '

    const selectResp = prepSelect({ alias, select, encryption, ctx })

    sql += selectResp.sql
    values.push(...selectResp.values)

    sql += ' FROM ?? '
    values.push(table)

    if (alias) {
        sql += '?? '
        values.push(alias)
    }

    if (join.length) {
        const joinResp = prepJoin({ alias, join, encryption, ctx })
        sql += joinResp.sql
        values.push(...joinResp.values)
    }

    if (Object.keys(where).length) {
        sql += 'WHERE '
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
        values.push(...havingResp.value)
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
 * 
 * @param {object} ifParam
 * 
 * @param {string} [ifParam.alias] (optional) local reference name of the table
 * 
 * @param {*} ifParam.val
 * 
 * @param {'and'|'or'}  [ifParam.junction] (optional) clause used to join conditions
 * 
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [ifParam.encryption] (optional) inherits encryption config from its parent level
 * 
 * @param {*} [caseParam.ctx] context reference to parent class
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepIf = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {

    let sql = ''
    const values = []

    console.log('val inside prepIf', val)

    const { condition = {}, trueValue = null, falseValue = null, as = 'if' } = val
    sql += 'IF('

    if (typeof condition === 'object') {
        const resp = prepWhere({ alias, where: condition, junction, encryption, ctx })
        sql += resp.sql
        values.push(...resp.values)
    } else {
        const ifPlaceholder = prepPlaceholder(condition)
        const ifName = prepName({ alias, value: condition })
        sql += ifPlaceholder
        if (!checkConstants(ifPlaceholder)) values.push(ifName)
    }

    sql += ', '

    const truePlaceholder = prepPlaceholder(trueValue)
    const trueName = prepName({ alias, value: trueValue })

    sql += truePlaceholder
    if (!checkConstants(trueValue)) values.push(trueName)

    sql += ', '

    const falsePlaceholder = prepPlaceholder(falseValue)
    const falseName = prepName({ alias, value: falseValue })

    sql += falsePlaceholder + ')'
    if (!checkConstants(falseValue)) values.push(falseName)

    sql += ' ?'
    values.push(as)

    return { sql, values }
}

/**
 * prepares switch case
 *@function prepCase
 * 
 * @param caseParam
 * 
 * @param {string} [caseParam.alias] reference to table name
 * 
 * @param {*} caseParam.val
 * 
 * @param {'and'|'or'} [caseParam.junction] (optional) clause used to join conditions
 * 
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [caseParam.encryption] (optional) inherits encryption config from its parent level
 * 
 * @param {*} [caseParam.ctx] context reference to parent class
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepCase = ({ alias, val, junction = 'and', encryption = undefined, ctx = undefined }) => {
    let sql = ''
    const values = []

    const { conditions = [], else: defaultElse, as = 'case' } = val

    sql += 'CASE '

    sql += conditions.map(condition => {

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

    sql == 'END'

    sql += ' ?'
    values.push(as)

    return { sql, values }
}

module.exports = { prepSelect, prepWhere, prepJoin }