const { colors } = require("./console.helper")
const { checkConstants, dataTypes, aggregateFunctions, constantFunctions } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

const junctions = { and: ' AND ', or: ' OR ' }

/**
 * checks if placeholder is variable or not
 * @function isVariable
 * @param {*} value 
 * @returns {boolean}
 */
const isVariable = value => (value.startsWith('$') || value.startsWith('#') || value === '?' || value === '??') && !checkConstants(value)

const conditions = {
    eq: ' = ',
    gt: ' > ',
    lt: ' < ',
    gtEq: ' >= ',
    ltEq: ' <= ',
    notEq: ' != ',
    exists: ' EXISTS ',
    notExists: ' NOT EXISTS',
    like: ' LIKE ',
    notLike: ' NOT LIKE ',
    startLike: ' LIKE ',
    endLike: ' LIKE ',
    notStartLike: ' NOT LIKE ',
    notEndLike: ' NOT LIKE ',
    in: ' IN ',
    notIn: ' NOT IN '
}

const joinTypes = {
    left: 'LEFT',
    right: 'RIGHT',
    inner: 'INNER',
    cross: 'CROSS',
    fullOuter: 'FULL OUTER',
}

/**
 * prepares select query using various 
 * @function prepSelect
 * @param {Object} selectParam
 * @param {string} [selectParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").SelectObject} selectParam.select array of columns / values / wrapper methods
 * @param {Array} [selectParam.values] (optional) local reference name of the table
 * @param {import("../defs/types").EncryptionConfig} [selectParam.encryption] (optional) query level encryption configuration
 * @param {*} [selectParam.ctx] (optional) context reference of the parent model class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepSelect = ({ alias, select = [], values, encryption = undefined, ctx = undefined }) => {
    if (!select || select.length === 0) return '*'

    const sqlParts = []

    for (let i = 0; i < select.length; i++) {
        const selectable = select[i]
        if (typeof selectable === 'object' && !Array.isArray(selectable)) {
            const [key, val] = Object.entries(selectable)[0]
            if (key in handleFunc) {
                sqlParts.push(handleFunc[key]({ alias, key, val, values, named: true, encryption, ctx }))
                continue
            }
            throw { message: `[Invalid]: Unknown object signature '${key}' detected`, cause: `Object signature '${key}' is not defined!` }
        }

        const placeholder = prepPlaceholder({ value: selectable, alias, ctx })
        if (!isVariable(placeholder)) {
            sqlParts.push(placeholder)
            continue
        }

        const name = prepName({ value: selectable, alias, ctx })
        values.push(name)
        sqlParts.push(placeholder.startsWith('$') ? `${placeholder} AS "${name}"` : placeholder)
    }
    return sqlParts.join(', ')
}

/**
 * prepares where statement
 * @function prepWhere
 * @param {Object} whereParam
 * @param {string} [whereParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").WhereObject|import("../defs/types").HavingObject} [whereParam.where] (optional) allows to filter records using various conditions
 * @param {string} [whereParam.parent] (optional) reference of parent key
 * @param {'and'|'or'} [whereParam.junction] (optional) clause used to connect multiple where conditions
 * @param {Array} [whereParam.values] reference of global values array
 * @param {import("../defs/types").EncryptionConfig} [whereParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [whereParam.ctx] (optional) local reference name of the table
 * @returns {string} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepWhere = ({ alias, where = {}, parent = null, junction = 'and', values, encryption = undefined, ctx = undefined }) => {
    if (Object.keys(where).length == 0) return ''
    const sqlParts = []
    const entries = Object.entries(where)

    for (let i = 0; i < entries.length; i++) {
        const key = entries[i][0]
        const val = entries[i][1]

        if (key in handleFunc) {
            sqlParts.push(handleFunc[key]({ alias, key, val, parent, junction, values, encryption, ctx }))
            continue
        }

        if (key in conditions) {
            const microSql = []
            if (parent && !(parent in conditions) && parent != 'refer') {
                const parentPlaceholder = prepPlaceholder({ value: parent, alias, ctx })
                microSql.push(parentPlaceholder)
                if (isVariable(parentPlaceholder)) values.push(prepName({ alias, value: parent, ctx }))
            }

            if (key === 'isNull' || key === 'isNotNull') {
                sqlParts.push(microSql.join(' '))
                continue
            }

            microSql.push(conditions[key])

            const valPlaceholder = handlePlaceholder({ value: val, alias, junction, values, parent, encryption, ctx })

            const prefix = {
                in: Array.isArray(val) ? `(${valPlaceholder})` : valPlaceholder,
                notIn: Array.isArray(val) ? `(${valPlaceholder})` : valPlaceholder,
                exists: valPlaceholder,
                notExists: valPlaceholder,
                like: ctx?.isPostgreSQL ? `'%' || ${valPlaceholder} || '%'` : `CONCAT("%", ${valPlaceholder}, "%")`,
                notLike: ctx?.isPostgreSQL ? `'%' || ${valPlaceholder} || '%'` : `CONCAT("%", ${valPlaceholder}, "%")`,
                startLike: ctx?.isPostgreSQL ? `${valPlaceholder} || '%'` : `CONCAT(${valPlaceholder}, "%")`,
                notStartLike: ctx?.isPostgreSQL ? `${valPlaceholder} || '%'` : `CONCAT(${valPlaceholder}, "%")`,
                endLike: ctx?.isPostgreSQL ? `'%' || ${valPlaceholder}` : `CONCAT("%", ${valPlaceholder})`,
                notEndLike: ctx?.isPostgreSQL ? `'%' || ${valPlaceholder}` : `CONCAT("%", ${valPlaceholder})`
            }

            microSql.push(`${prefix[key] || valPlaceholder}`)
            sqlParts.push(microSql.join(' '))
            continue
        }

        if (Array.isArray(val)) {
            const keyPlaceholder = prepPlaceholder({ value: key, alias, ctx })
            if (isVariable(keyPlaceholder)) values.push(prepName({ alias, value: key, ctx }))
            const valuePlaceholders = []
            for (let j = 0; j < val.length; j++) {
                const value = val[j]
                const valPlaceholder = prepPlaceholder({ value, alias, ctx })
                if (isVariable(valPlaceholder)) values.push(prepName({ alias, value, ctx }))
                valuePlaceholders.push(valPlaceholder)
            }
            sqlParts.push(`${keyPlaceholder} IN (${valuePlaceholders.join(', ')})`)
            continue
        }

        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
            const keyPlaceholder = prepPlaceholder({ value: key, alias, ctx })
            if (isVariable(keyPlaceholder)) values.push(prepName({ alias, value: key, ctx }))

            if (val === 'isNull' || val === 'isNotNull' || val === null) {
                sqlParts.push(`${keyPlaceholder} ${constantFunctions[val]}`)
                continue
            }

            const valPlaceholder = prepPlaceholder({ value: val, alias, ctx })
            if (isVariable(valPlaceholder)) values.push(prepName({ alias, value: val, ctx }))

            sqlParts.push(`${keyPlaceholder} = ${valPlaceholder}`)
            continue
        }

        sqlParts.push(prepWhere({ alias, where: val, parent: key, junction, values, encryption, ctx }))
    }

    return sqlParts.filter(Boolean).join(junctions[junction])
}

/**
 * prepares join query statement
 * @function prepJoin
 * @param {Object} joinParam
 * @param {string} [joinParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").JoinObject} joinParam.join array of joining conditions
 * @param {Array} joinParam.values
 * @param {import("../defs/types").EncryptionConfig} [joinParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [joinParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepJoin = ({ alias, join = [], values, encryption = undefined, ctx = undefined }) => {
    return join.map(joinable => {

        const { type = null, select = [], table, alias: joinAlias = null, join: nestedJoin = [], where = {}, groupBy = [], having = {}, orderBy = {}, junction = 'and', using = [], limit = undefined, offset = undefined, as = null } = joinable
        if (!table) throw { message: `[Missing]: 'table' name to be associated is missing`, cause: "Missing 'table' property inside join object" }
        const sqlParts = []
        if (joinTypes[type]) sqlParts.push(joinTypes[type])
        sqlParts.push('JOIN')
        if (select.length || Object.keys(where).length || Object.keys(having).length || nestedJoin.length) {
            sqlParts.push(`(SELECT ${prepSelect({ alias: joinAlias, select, values, encryption, ctx })} FROM ${ctx?.isMySQL ? '??' : `"${table}"`}`)
            if (ctx.isMySQL) values.push(table)
            if (joinAlias) {
                if (ctx.isMySQL) values.push(joinAlias)
                sqlParts.push(ctx?.isMySQL ? '??' : `"${joinAlias}"`)
            }
            if (nestedJoin.length) sqlParts.push(prepJoin({ alias: joinAlias, join: nestedJoin, values, encryption, ctx }))
            if (Object.keys(where).length > 0) sqlParts.push(`WHERE ${prepWhere({ alias: joinAlias, where, junction, values, encryption, ctx })}`)
            if (groupBy.length) sqlParts.push(patchGroupBy({ groupBy, alias, values, ctx }))
            if (Object.keys(having).length > 0) sqlParts.push(`HAVING ${prepWhere({ alias: joinAlias, where: having, junction, values, encryption, ctx })}`)
            if (Object.keys(orderBy).length > 0) sqlParts.push(prepOrderBy({ alias: joinAlias, orderBy, values, ctx }))
            if (typeof limit === 'number') sqlParts.push(patchLimit(limit, values, ctx))
            if (typeof offset === 'number') sqlParts.push(patchLimit(offset, values, ctx, 'OFFSET'))
            if (!as) throw { message: `Missing 'as' property with selective join association`, cause: `Every derived table must have its own alias ('as' property)` }
            sqlParts.push(`) AS ${ctx?.isMySQL ? '??' : `"${as}"`}`)
            if (ctx.isMySQL) values.push(as)
        } else {
            sqlParts.push(ctx?.isMySQL ? '??' : `"${table}"`)
            if (ctx.isMySQL) values.push(table)
            if (joinAlias) {
                if (ctx.isMySQL) values.push(joinAlias)
                sqlParts.push(ctx?.isMySQL ? '??' : `"${joinAlias}"`)
            }
        }

        if (!using.length && !Object.keys(using).length) throw { message: 'Common column(s) to associate tables is missing', cause: "Missing conditions for association in 'using' clause" }

        if (Array.isArray(using)) {
            sqlParts.push(`USING (${using.map(column => {
                if (ctx.isMySQL) values.push(column)
                return ctx?.isMySQL ? '??' : `"${column}"`
            }).join(', ')})`)
        } else if (typeof using === 'object') {
            const usingConditions = Object.entries(using).map(([parentColumn, childColumn]) => {
                const parentPlaceholder = prepPlaceholder({ value: parentColumn, alias, ctx })
                const parentColumnName = prepName({ value: parentColumn, alias, ctx })
                if (ctx?.isMySQL) {
                    values.push(parentColumnName)
                }

                if (typeof childColumn === 'object') {
                    const resp = handlePlaceholder({ value: childColumn, alias: joinAlias, values, encryption, ctx })
                    return `${parentPlaceholder} ${resp}`
                }
                const childPlaceholder = prepPlaceholder({ value: childColumn, alias: joinAlias, ctx })
                if (ctx.isMySQL) values.push(prepName({ value: childColumn, alias: joinAlias, ctx }))
                return `${parentPlaceholder} = ${childPlaceholder}`
            })
            sqlParts.push(`ON ${usingConditions.join(' AND ')}`)
        } else {
            throw { message: `[Invalid]: 'using' property can either be an array of column names or an array of objects in { parentColumnName: childColumnName } format`, cause: `Invalid format for 'using' property inside 'join'` }
        }
        return sqlParts.join(' ')
    }).join(' ')
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
const prepJson = ({ val, encryption = undefined, junction = 'and', values, named = false, ctx = undefined }) => {

    const sqlParts = []
    const { value, aggregate = false, table = null, alias = null, join = [], where = {}, groupBy = [], having = {}, orderBy = {}, limit = undefined, offset = undefined, as = null, extract = null, contains = null, compare = {} } = val

    const isAggregatedLimit = table && aggregate && (limit || offset)
    const UnSQLJsonAlias = `UNSQL_JSON_ALIAS${table ? `_${table}` : ''}`

    if (table || Object.keys(where).length || Object.keys(having).length) sqlParts.push(`(SELECT`)

    let jsonSql = ''
    if (typeof value === 'string') {
        const jsPlaceholder = prepPlaceholder({ value, alias: isAggregatedLimit ? UnSQLJsonAlias : alias, ctx })
        if (isVariable(jsPlaceholder)) values.push(prepName({ alias: isAggregatedLimit ? UnSQLJsonAlias : alias, value, ctx }))
        jsonSql = jsPlaceholder
    } else {
        if (ctx?.isPostgreSQL) {
            jsonSql = prepJsonB({ value, values, ctx, aggregate })
        } else { // handle json if dialect is 'mysql'
            jsonSql = Object.entries(value).map(([k, v]) => {
                const kPlaceholder = '?'
                if (!Array.isArray(value)) values.push(k)
                const vPlaceholder = handlePlaceholder({ value: v, alias: isAggregatedLimit ? UnSQLJsonAlias : alias, junction, values, encryption, ctx })
                return (!Array.isArray(value) ? `${kPlaceholder}, ` : '') + vPlaceholder
            }).join(', ')
            if (Array.isArray(value)) jsonSql = `JSON_ARRAY(${jsonSql})`
            else if (typeof value === 'object') jsonSql = `JSON_OBJECT(${jsonSql})`
        }
    }
    if (aggregate) {
        if (ctx?.isMySQL) jsonSql = `JSON_ARRAYAGG(${jsonSql})`
        else if (ctx?.isPostgreSQL) jsonSql = `JSON_AGG(${jsonSql})`
        else if (ctx?.isSQLite) jsonSql = `JSON_GROUP_ARRAY(${jsonSql})`
    }
    jsonSql = prepJsonExtract(jsonSql, extract, values, ctx)
    jsonSql = prepJsonContains({ jsonRef: jsonSql, contains, values, alias: isAggregatedLimit ? UnSQLJsonAlias : alias, ctx })

    sqlParts.push(jsonSql) // finally patching jsonSql (with all wrappers and methods) to main sql

    if (table) {
        sqlParts.push(`FROM`)
        // will be patched only if aggregate with limit and offset are set
        if (aggregate && (limit || offset)) sqlParts.push(`(SELECT * FROM`)
        sqlParts.push(ctx?.isMySQL ? '??' : `"${table}"`)
        if (ctx.isMySQL) values.push(table)

        if (alias) {
            if (ctx.isMySQL) values.push(alias)
            sqlParts.push(ctx.isMySQL ? '??' : `"${alias}"`)
        }

        if (join.length) sqlParts.push(prepJoin({ alias, join, values, encryption, ctx }))
        if (Object.keys(where).length) sqlParts.push(`WHERE ${prepWhere({ alias, where, junction: 'and', values, encryption, ctx })}`)
        if (groupBy.length > 0) sqlParts.push(patchGroupBy({ groupBy, alias, values, ctx }))
        if (Object.keys(having).length) sqlParts.push(`HAVING ${prepWhere({ alias, where: having, junction: 'and', values, encryption, ctx })}`)
        if (Object.keys(orderBy).length > 0) sqlParts.push(prepOrderBy({ alias, orderBy, values, ctx }))
        if (typeof limit === 'number') sqlParts.push(patchLimit(limit, values, ctx))
        if (typeof offset === 'number') sqlParts.push(patchLimit(offset, values, ctx, 'OFFSET'))

        sqlParts.push(`)`)
        // intermediate alias only patched only if aggregate with limit and offset are set
        if (aggregate && (limit || offset)) {
            sqlParts.push(`AS ${UnSQLJsonAlias})`)
        }
    }

    if (as || named) {
        if (ctx?.isMySQL) {
            sqlParts.push('AS ?')
            values.push(as || 'json')
        } else {
            sqlParts.push(`AS ${as || 'json'}`)
        }
    }
    if (Object.keys(compare).length) sqlParts.push(prepWhere({ alias, where: compare, junction, values, encryption, ctx }))
    return sqlParts.join(' ')
}

/**
 * prepares aggregate functions
 * @function prepAggregate
 * @param {Object} aggParam object with different properties that help generate aggregate method
 * @param {string} [aggParam.alias] (optional) local reference name of the table
 * @param {string} aggParam.key refers the name of the aggregate method, viz. 'sum', 'avg', 'min', 'max' etc.
 * @param {import("../defs/types").BaseAggregate} aggParam.val accepts values related to aggregate method
 * @param {*} [aggParam.parent] reference of previous placeholder
 * @param {import("../defs/types").EncryptionConfig} [aggParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [aggParam.ctx] context reference to parent class
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepAggregate = ({ alias, key, val, parent = null, junction = 'and', values, encryption = undefined, ctx = undefined }) => {
    const { value, distinct = false, cast = null, ifNull = undefined, compare = {}, as = null } = val
    const placeholder = handlePlaceholder({ alias, value, parent, junction, values, encryption, ctx })
    let sql = `${aggregateFunctions[key]}(${distinct ? 'DISTINCT ' : ''}${placeholder})`
    if (ifNull != undefined) {
        const nullPlaceholder = prepPlaceholder({ value: ifNull, alias, ctx })
        const nullValue = prepName({ alias, value: ifNull, ctx })
        if (isVariable(nullPlaceholder)) values.push(nullValue)
        sql = `IFNULL(${sql}, ${nullPlaceholder})`
    }
    // type casting ends here
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`
    if (as) {
        sql += ` AS ${ctx?.isMySQL ? '?' : as}`
        if (ctx?.isMySQL) values.push(as)
    }
    if (Object.keys(compare).length) return `${sql} ${prepWhere({ alias, where: compare, values, encryption, ctx })}`
    return sql
}

/**
 * prepares sub query
 * @function prepRefer
 * @param {Object} referParam object with different properties that help generate aggregate method
 * @param {import("../defs/types").BaseQuery} referParam.val accepts values related to aggregate method
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepRefer = ({ val, parent = null, values, encryption = undefined, ctx = undefined }) => {

    const { select = ['*'], table, alias = null, join = [], where = {}, junction = 'and', groupBy = [], having = {}, orderBy = {}, limit = null, offset = null, as = null } = val
    const sqlParts = []
    sqlParts.push(`${prepSelect({ alias, select, values, encryption, ctx })} FROM ${ctx?.isMySQL ? '??' : `"${table}"`}`)
    if (ctx.isMySQL) values.push(table)
    if (alias) {
        if (ctx.isMySQL) values.push(alias)
        sqlParts.push(ctx?.isMySQL ? '??' : `"${alias}"`)
    }
    if (join.length) sqlParts.push(prepJoin({ alias, join, encryption, ctx }))
    if (Object.keys(where).length) sqlParts.push(`WHERE ${prepWhere({ alias, where, junction, parent, values, encryption, ctx })}`)
    if (groupBy.length) sqlParts.push(patchGroupBy({ groupBy, alias, values, ctx }))
    if (Object.keys(having).length) sqlParts.push(`HAVING ${prepWhere({ alias, where: having, junction, values, encryption, ctx })}`)
    if (Object.keys(orderBy).length) sqlParts.push(prepOrderBy({ alias, orderBy, ctx }))
    if (typeof limit === 'number') sqlParts.push(patchLimit(limit, values, ctx))
    if (typeof offset === 'number') sqlParts.push(patchLimit(offset, values, ctx, 'OFFSET'))
    if (as && ctx?.isMySQL) values.push(as)
    return `(SELECT ${sqlParts.join(' ')})${as ? ` AS ${ctx?.isMySQL ? '?' : `"${as}"`}` : ''}`
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
const prepIf = ({ alias, val, junction = 'and', values, encryption = undefined, ctx = undefined }) => {
    if (!ctx.isMySQL) throw { message: `'if' object is only available in 'mysql'`, cause: `'${ctx?.config?.dialect}' does not support 'if' condition`, suggestion: `Use 'switch' object, works the same` }
    const { check = {}, trueValue = null, falseValue = null, cast = null, as = null } = val
    const ifPlaceholder = handlePlaceholder({ alias, value: check, junction, values, encryption, ctx })
    const truePlaceholder = trueValue == null || trueValue == 'null' ? null : handlePlaceholder({ alias, value: trueValue, junction, values, encryption, ctx })
    const falsePlaceholder = falseValue == null || falseValue == 'null' ? null : handlePlaceholder({ alias, value: falseValue, junction, values, encryption, ctx })
    if (as && ctx?.isMySQL) values.push(as)
    if (cast) return `CAST(IF(${ifPlaceholder}, ${truePlaceholder}, ${falsePlaceholder}) AS ${dataTypes[cast] || 'CHAR'})${as ? ` AS ${ctx?.isMySQL ? '?' : `"${as}"`}` : ''}`
    return `IF(${ifPlaceholder}, ${truePlaceholder}, ${falsePlaceholder})${as ? ` AS ${ctx?.isMySQL ? '?' : `"${as}"`}` : ''}`
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
const prepCase = ({ alias, val, junction = 'and', values, encryption = undefined, ctx = undefined }) => {
    const { check = [], else: defaultElse, cast = null, as = null } = val
    const conditionalPlaceholders = check.map(condition => {
        const { when, then } = condition
        const whenPlaceholder = handlePlaceholder({ alias, value: when, junction, values, encryption, ctx })
        const thenPlaceholder = then == null || then == 'null' ? null : handlePlaceholder({ alias, value: then, junction, values, encryption, ctx })
        return `WHEN ${whenPlaceholder} THEN ${thenPlaceholder}`
    })
    const elsePlaceholder = defaultElse == null || defaultElse == 'null' ? null : handlePlaceholder({ alias, value: defaultElse, ctx, values })

    if (as && ctx?.isMySQL) values.push(as)
    if (cast) return `CAST(CASE ${conditionalPlaceholders.join(' ')} ELSE ${elsePlaceholder} END AS ${dataTypes[cast] || 'CHAR'})${as ? ` AS ${ctx?.isMySQL ? '?' : `"${as}"`}` : ''}`
    return `CASE ${conditionalPlaceholders.join(' ')} ELSE ${elsePlaceholder} END${as ? ` AS ${ctx?.isMySQL ? '?' : `"${as}"`}` : ''}`
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
const prepConcat = ({ alias, val, junction = 'and', values, encryption = undefined, ctx = undefined }) => {
    const { value = [], pattern = '', substr = null, reverse = false, textCase = null, padding = {}, trim = false, as = null, compare = {} } = val
    const patternPlaceholder = prepPlaceholder({ value: pattern, alias, ctx })
    if (isVariable(patternPlaceholder)) values.push(prepName({ alias, value: pattern, ctx }))
    let sql = `CONCAT_WS(${patternPlaceholder}, ${value.map(v => handlePlaceholder({ alias, value: v, junction, values, encryption, ctx })).join(', ')})`

    // trim
    if (trim === 'left') sql = `LTRIM(${sql})`
    else if (trim === 'right') sql = `RTRIM(${sql})`
    else if (trim === true) sql = `TRIM(${sql})`

    // substring extras
    if (!!substr) sql = prepSubStr({ length: substr?.length, start: substr?.start, sql, values, ctx })

    // apply right padding (extras)
    if (padding?.right) sql = prepPadding({ sql, values, side: 'R', length: padding?.right?.length, pattern: padding?.right?.pattern, ctx })

    // apply left padding (extras)
    if (padding?.left) sql = prepPadding({ sql, values, length: padding?.left?.length, pattern: padding?.left?.pattern, ctx })

    // text case ends here
    if (textCase === 'lower') sql = `LOWER(${sql})`
    else if (textCase === 'upper') sql = `UPPER(${sql})`

    // handle reverse
    if (reverse) {
        if (ctx?.isSQLite) throw { message: `String 'reverse' is not supported by 'sqlite'`, cause: 'SQLite does not support string reversal' }
        sql = `REVERSE(${sql})`
    }

    if (Object.keys(compare).length) sql += prepWhere({ alias, where: compare, junction, values, encryption, ctx })

    if (!Object.keys(compare).length && as) {
        if (ctx?.isMySQL) {
            sql += ` AS ?`
            values.push(as)
        } else {
            sql += ` AS "${as}"`
        }
    }
    return sql
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
const prepString = ({ alias, val, junction = 'and', values, named = false, encryption = undefined, ctx = undefined }) => {

    const { value, replace = null, reverse = false, textCase = null, padding = {}, substr = null, trim = false, cast = null, decrypt = null, encoding = 'utf8mb4', as = ctx?.isPostgreSQL ? 'str' : null, compare = {} } = val

    // prepare place holder
    let sql = prepPlaceholder({ value, alias, ctx })
    if (isVariable(sql)) {
        values.push(prepName({ alias, value, ctx }))
    }

    // envelop decrypt
    if (decrypt) sql = prepDecryption({ placeholder: sql, value, decrypt, encoding, values, encryption, ctx })

    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    // trim
    if (trim === 'left') sql = `LTRIM(${sql})`
    else if (trim === 'right') sql = `RTRIM(${sql})`
    else if (trim === true) sql = `TRIM(${sql})`

    // substring extras
    if (!!substr) sql = prepSubStr({ length: substr?.length, start: substr?.start, sql, values, ctx })

    // apply right padding (extras)
    if (padding?.right) sql = prepPadding({ sql, values, side: 'R', length: padding?.right?.length, pattern: padding?.right?.pattern, ctx })

    // apply left padding (extras)
    if (padding?.left) sql = prepPadding({ sql, values, length: padding?.left?.length, pattern: padding?.left?.pattern, ctx })

    // text case ends here
    if (textCase === 'lower') sql = `LOWER(${sql})`
    else if (textCase === 'upper') sql = `UPPER(${sql})`

    // handle reverse
    if (reverse) {
        if (ctx?.isSQLite) throw { message: `SQLite does not support 'reverse' feature`, cause: 'SQLite does not support string reversal' }
        sql = `REVERSE(${sql})`
    }

    // replace target content ends here
    if (replace != null) {
        // handle if padding length is missing
        if (!replace?.target) {
            throw { message: `[Missing]: Replace 'target' string is missing!`, cause: "Missing 'target' property inside 'replace'" }
        }
        // handle if padding pattern is missing
        if (!replace?.replaceWith) {
            throw { message: `[Missing]: 'replaceWith' string is missing!`, cause: "Missing 'replaceWith' property inside 'replace'" }
        }

        sql = `REPLACE(${sql} ${ctx?.isPostgreSQL ? `, $${ctx._variableCount++}, $${ctx._variableCount++}` : ', ?, ?'} )`
        values.push(replace?.target, replace?.replaceWith)
    }

    if (Object.keys(compare).length) sql += prepWhere({ alias, where: compare, junction, values, encryption, ctx })

    if (!Object.keys(compare).length && (as || named)) {
        sql += ` AS ${ctx?.isMySQL ? '?' : `"${(as || value.split('.').pop())}"`}`
        if (ctx?.isMySQL) values.push(as || value.split('.').pop())
    }
    return sql
}

const dateUnits = {
    f: 'MICROSECOND',
    s: 'SECOND',
    m: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    M: 'MONTH',
    q: 'QUARTER',
    y: 'YEAR',
}

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
const prepDate = ({ alias, val, junction = 'and', values, named = false, encryption = undefined, ctx = undefined }) => {
    // deconstruct different props from the val object
    const { value, add = 0, sub = 0, format = null, fromPattern = null, cast = null, decrypt = null, encoding = 'utf8mb4', as = ctx?.isPostgreSQL ? 'date' : null, compare = {} } = val

    // init local sql string and values array
    const localValues = [] // using due to 'unshift' (required for 'format' in sqlite)

    // extract placeholder
    let sql = prepPlaceholder({ value, alias, ctx })

    // patch value to values array (conditional)
    if (isVariable(sql)) {
        // prepare name
        localValues.push(prepName({ alias, value, ctx }))
    }

    // decrypt
    if (decrypt) sql = prepDecryption({ placeholder: sql, value, decrypt, values, encryption, encoding, ctx })

    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    // create date from string pattern
    if (fromPattern) {
        if (ctx?.isSQLite) throw { message: `[Invalid]: 'fromPattern' is not supported by 'sqlite'`, cause: `'fromPattern' is not a part of 'sqlite'` }
        sql = `${ctx?.isPostgreSQL ? 'TO_TIMESTAMP' : 'STR_TO_DATE'}(${sql}, ?)`
        localValues.push(replaceDatePatterns({ format: fromPattern, dialect: ctx?.config?.dialect }))
    }

    const dateOps = {
        mysql: (sql, modifier, values, operator = '+') => {
            if (typeof modifier === 'number') {
                values.push(modifier)
                return operator == '+' ? `ADDDATE(${sql}, ?)` : `SUBDATE(${sql}, ?)`
            } else { // modifier is pattern
                const patterns = modifier.split(' ')
                for (let i = 0; i < patterns.length; i++) {
                    const unit = patterns[i]?.match(/[a-z]+/ig) || ''
                    if (!dateUnits[unit]) throw { message: `[Invalid]: '${patterns[i]}' contains unknown unit '${unit}' in '${operator == '+' ? 'add' : 'sub'}' property of 'date' object`, cause: `Unknown unit '${unit}' provided` }
                    if (i == 0) {
                        sql = `${operator == '+' ? 'DATE_ADD' : 'DATE_SUB'}(${sql}, INTERVAL ? ${dateUnits[unit]})`
                    } else {
                        sql += ` ${operator} INTERVAL ? ${dateUnits[unit]}`
                    }
                    values.push(parseFloat(patterns[i]))
                }
                return sql
            }
        }, // mysql ends

        postgresql: (sql, modifier, values, operator = '+') => {
            if (typeof modifier === 'number') {
                values.push(`${modifier} DAY`)
                return `${sql}${patchDateCast(values[0])} ${operator} $${ctx._variableCount++}::interval`
            } else {
                return `${sql}${patchDateCast(values[0])}` + modifier.split(' ').map((i, index) => {
                    const unit = i?.match(/[a-z]+/ig) || ''
                    if (!dateUnits[unit]) throw { message: `[Invalid]: '${i}' contains unknown unit '${unit}' in '${operator == '+' ? 'add' : 'sub'}' property of 'date' object`, cause: `Unknown unit '${unit}' provided` }
                    values.push(`${parseFloat(i)} ${dateUnits[unit]}`)
                    return `${index === 0 ? ` ${operator} ` : ''}$${ctx._variableCount++}::interval`
                }).join(` ${operator} `)
            }
        }, // postgresql ends

        sqlite: (sql, modifier, values, operator = '+') => {
            const fn = !values[0] || sql?.includes('DATETIME(') || (values[0]?.includes('-') && values[0]?.includes(':')) ? `DATETIME` : (values[0]?.includes('-') || sql?.includes('DATE(')) && !values[0]?.includes(':') ? `DATE` : `TIME`
            if (typeof modifier === 'number') {
                values.push(`${operator}${modifier} DAY`)
                return `${fn}(${sql}, ?)`
            } else {
                return `${fn}(${sql}, ` + modifier.split(' ').map(i => {
                    const unit = i?.match(/[a-z]+/ig) || ''
                    if (!dateUnits[unit]) throw { message: `[Invalid]: '${i}' contains unknown unit '${unit}' in '${operator == '+' ? 'add' : 'sub'}' property of 'date' object`, cause: `Unknown unit '${unit}' provided` }
                    values.push(`${operator}${parseFloat(i)} ${dateUnits[unit]}`)
                    return `?`
                }).join(', ') + ')'
            }
        }, // sqlite ends
    } // dateOps ends

    if (add) sql = dateOps[ctx?.config?.dialect](sql, add, localValues)
    if (sub) sql = dateOps[ctx?.config?.dialect](sql, sub, localValues, '-')

    if (format) {
        if (ctx?.isMySQL) {
            sql = `DATE_FORMAT(${sql}, ?)`
            localValues.push(replaceDatePatterns({ format, dialect: 'mysql' }))
        }
        else if (ctx?.isPostgreSQL) {
            sql = `to_char(${sql}, $${ctx._variableCount++})`
            localValues.push(replaceDatePatterns({ format, dialect: 'postgresql' }))
        }
        else if (ctx?.isSQLite) {
            sql = `strftime(?, ${sql})`
            localValues.unshift(replaceDatePatterns({ format, dialect: 'sqlite' }))
        }
    }

    if (Object.keys(compare).length) sql += prepWhere({ alias, where: compare, junction, values: localValues, encryption, ctx })

    if (!Object.keys(compare).length && (as || named)) {
        sql += ' AS ' + (ctx?.isMySQL ? '?' : (as || value.split('.').pop()))
        if (ctx?.isMySQL) localValues.push(as || value.split('.').pop())
    }
    values.push(...localValues)
    return sql
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
const prepNumeric = ({ alias, val, junction = 'and', values, named = false, encryption, ctx = 0 }) => {

    const { value, decimals = null, mod = null, sub = null, add = null, multiplyBy = null, divideBy = null, power = null, cast = null, decrypt = null, encoding = 'utf8mb4', as = ctx?.isPostgreSQL ? 'num' : null, compare = {} } = val

    // patch placeholder to the sql string
    let sql = prepPlaceholder({ value, alias, ctx })
    if (isVariable(sql)) values.push(prepName({ alias, value, ctx }))

    // envelop decrypt
    if (decrypt) sql = prepDecryption({ placeholder: sql, value, decrypt, values, encoding, encryption, ctx })

    // apply power
    if (power != null) {
        const powPlaceholder = prepPlaceholder({ value: power, alias, ctx })
        sql = `${ctx?.isSQLite ? 'POW' : 'POWER'}(${sql}, ${powPlaceholder})`
        if (isVariable(powPlaceholder)) values.push(prepName({ alias, value: power, ctx }))
    }

    // apply division
    if (divideBy != null) {
        const divisorPlaceholder = prepPlaceholder({ value: divideBy, alias, ctx })
        sql = `(${sql} / ${divisorPlaceholder})`
        if (isVariable(divisorPlaceholder)) values.push(prepName({ alias, value: divideBy, ctx }))
    }

    // apply modulus
    if (mod != null) {
        const modPlaceholder = prepPlaceholder({ value: mod, alias, ctx })
        sql = `(${sql} % ${modPlaceholder})`
        if (isVariable(modPlaceholder)) values.push(prepName({ alias, value: mod, ctx }))
    }

    // apply multiplier
    if (multiplyBy != null) {
        const multiplierPlaceholder = prepPlaceholder({ value: multiplyBy, alias, ctx })
        sql = `(${sql} * ${multiplierPlaceholder})`
        if (isVariable(multiplierPlaceholder)) values.push(prepName({ alias, value: multiplyBy, ctx }))
    }

    // apply addition
    if (add != null) {
        const addPlaceholder = prepPlaceholder({ value: add, alias, ctx })
        sql = `(${sql} + ${addPlaceholder})`
        if (isVariable(addPlaceholder)) values.push(prepName({ alias, value: add, ctx }))
    }

    // apply subtraction
    if (sub != null) {
        const subPlaceholder = prepPlaceholder({ value: sub, alias, ctx })
        sql = `(${sql} - ${subPlaceholder})`
        if (isVariable(subPlaceholder)) values.push(prepName({ alias, value: sub, ctx }))
    }

    // apply decimal format
    if (decimals === 'ceil') sql = `CEIL(${sql})`
    else if (decimals === 'floor') sql = `FLOOR(${sql})`
    else if (decimals === 'round') sql = `ROUND(${sql})`
    else if (typeof decimals === 'number') {
        sql = `${ctx?.isMySQL ? 'FORMAT' : 'ROUND'}(${sql}, ${ctx?.isPostgreSQL ? `$${ctx._variableCount++}` : '?'})`
        values.push(decimals)
    }

    // type casting
    if (cast) sql = `CAST(${sql} AS ${dataTypes[cast] || 'CHAR'})`

    if (Object.keys(compare).length) sql += prepWhere({ alias, where: compare, junction, values, encryption, ctx })

    if (!Object.keys(compare).length && (as || named)) {
        sql += ` AS ${ctx?.isMySQL ? '?' : `"${(as || value.split('.').pop())}"`}`
        if (ctx?.isMySQL) values.push(as || value.split('.').pop())
    }

    return sql
}

/**
 * patches group by clause
 * @function patchGroupBy
 * @param {Object} options
 * @param {Array} options.groupBy
 * @param {string} [options.alias]
 * @param {Array} [options.values]
 * @param {*} [options.ctx]
 * @returns {string}
 */
const patchGroupBy = ({ groupBy, alias, values, ctx }) => {
    if (groupBy.length == 0) return ''

    const sqlParts = []

    for (let i = 0; i < groupBy.length; i++) {
        const col = prepName({ value: groupBy[i], alias, ctx })
        if (!ctx?.isMySQL) {
            sqlParts.push(col)
            continue
        }
        sqlParts.push('??')
        values.push(col)

    }

    return `GROUP BY ${sqlParts.join(', ')}`
}

const orderDirections = { asc: 'ASC', desc: 'DESC' }

/**
 * patches order by clause
 * @function prepOrderBy
 * @param {Object} options
 * @param {{[column:string]:'asc'|'desc'}} options.orderBy
 * @param {string} [options.alias]
 * @param {Array} [options.values]
 * @param {*} [options.ctx]
 * @returns {string}
 */
const prepOrderBy = ({ alias, orderBy, values, ctx }) => {
    if (!Object.keys(orderBy).length) return ''

    const entries = Object.entries(orderBy)

    const sqlParts = []

    for (let i = 0; i < entries.length; i++) {
        const name = prepName({ alias, value: entries[i][0], ctx })
        const order = orderDirections[entries[i][1]]
        if (!ctx?.isMySQL) {
            sqlParts.push(`${name} ${order}`)
            continue
        }
        values.push(name)
        sqlParts.push(`?? ${order}`)
    }
    return `ORDER BY ${sqlParts.join(', ')}`
}

const prepJsonB = ({ value, aggregate = false, alias = null, values, ctx }) => {
    const patch = (val, values) => {
        if (typeof val === 'object') {
            return prepJsonB({ value: val, alias, values, ctx })
        }
        const placeholder = prepPlaceholder({ value: val, alias, ctx })
        // const placeholder = handlePlaceholder({ value: val, alias, values, ctx })
        if (isVariable(placeholder)) values.push(prepName({ value: val, alias, ctx }))
        return `${placeholder}${isVariable(placeholder) ? `::${typeMap[typeof val](val)}` : ''}`
    }

    const typeMap = {
        number: val => `${Number.isInteger(val) ? 'int' : 'numeric'}`,
        string: val => `text`,
        boolean: val => `boolean`
    }

    let sql = ''
    if (Array.isArray(value)) {
        sql = `json_build_array(${value.map(val => patch(val, values)).join(', ')})`
    } else if (typeof value === 'object') {
        sql = `json_build_object(${Object.entries(value).map(([k, v]) => `'${k}', ${patch(v, values)}`).join(', ')})`
    }

    if (aggregate) return `json_agg(${sql})`
    return sql
}

const prepJsonExtract = (jsonRef, extract, values, ctx) => {
    if (extract === null || extract === undefined || extract === '') return jsonRef
    if (ctx?.isPostgreSQL) {
        extract = extract.replace('[', '.').replace(']', '')
        if (extract.startsWith('.')) extract = extract.substring(1)
        if (extract.includes('.')) {
            values.push(`{${extract.replace('.', ',')}}`)
            return `${jsonRef}#>$${ctx._variableCount++}`
        }
        values.push(extract)
        return `${jsonRef}->$${ctx._variableCount++}`
    }
    if (typeof extract === 'number') values.push(`$[${extract}]`)
    else if (typeof extract === 'string' && extract.startsWith('[')) values.push(`$${extract}`)
    else values.push('$.' + extract)
    return `JSON_EXTRACT(${jsonRef}, ?)`
}

const prepJsonContains = ({ jsonRef, contains, values, ctx, alias = null }) => {
    if (!contains) return jsonRef
    if (ctx?.config?.dialect != 'mysql' && ctx?.config?.dialect != 'postgresql') throw { message: `Feature to check if json array 'contains' a 'value' is not supported by '${ctx?.config?.dialect}'`, cause: `Not all Json features are supported by '${ctx?.config?.dialect}'` }

    if (ctx?.isPostgreSQL) {
        values.push(JSON.stringify(contains))
        return `${jsonRef}@>$${ctx._variableCount++}`
    }

    const name = prepName({ value: contains, alias, ctx })
    if (typeof name === 'string') { if (name.startsWith('#')) values.push(name) }
    else values.push(JSON.stringify(name))

    return `JSON_CONTAINS(${jsonRef}, ${typeof name === 'string' && !name.startsWith('#') ? `CAST(${name} AS CHAR)` : '?'}${typeof name === 'string' && !name.startsWith('#') ? `, '$'` : ''})`
}

const prepEncryption = ({ placeholder, col, encrypt = {}, values, encryption, ctx }) => {
    if (!encrypt[col]) return placeholder
    if (!ctx?.isMySQL && !ctx?.isPostgreSQL) throw { message: `[Invalid]: No built-in AES Encryption support found for '${ctx?.config?.dialect}'`, cause: `AES Encryption not supported by '${ctx?.config?.dialect}'` }

    const config = { ...(ctx?.config?.encryption || {}), ...(encryption || {}), ...(encrypt[col] || {}) }
    const modes = ['aes-128-ecb', 'aes-256-cbc']

    // validate encryption mode
    if (config?.mode && !modes.includes(config?.mode?.toLowerCase())) throw { message: `[Invalid]: Encryption mode '${config?.mode}' provided for column: '${col}'`, cause: 'Invalid encryption mode' }

    // check secret exists or not
    if (!config?.secret) throw { message: `[Missing]: Secret key is required for encryption of column: '${col}'`, cause: 'Secret key is missing' }

    if (ctx?.isPostgreSQL) {
        values.push(config?.secret)
        values.push('compress-algo=1, cipher-algo=' + (config?.mode || 'aes256').toLowerCase().replace('-cbc', '').replace('-', ''))
        return `pgp_sym_encrypt(${placeholder}, $${ctx._variableCount++}, $${ctx._variableCount++})`
    }

    // check iv (in 'cbc' mode) exists or not
    if (!config.iv && config?.mode.includes('cbc')) throw { message: `[Missing]: Initialization Vector (iv) is required (in '${config?.mode}') for encryption of column: '${col}'`, cause: 'Initialization Vector (iv) is missing' }
    values.push(config?.secret)
    if (config?.mode?.includes('cbc')) values.push(config?.iv)
    values.push(config?.sha || 512)
    return `AES_ENCRYPT(${placeholder} ${config?.mode?.includes('cbc') ? ', ?' : ''}, UNHEX(SHA2(?, ?)))`
}

const prepDecryption = ({ placeholder, value, decrypt, encoding, values, encryption, ctx }) => {

    if (!ctx?.isMySQL && !ctx?.isPostgreSQL) throw { message: `[Invalid]: No built-in AES Decryption support found for '${ctx?.config?.dialect}'`, cause: `AES Decryption not supported by '${ctx?.config?.dialect}'` }

    if (!decrypt) return placeholder

    const config = { ...(decrypt || {}), ...(encryption || {}), ...(ctx?.config?.encryption) }
    const modes = ['aes-128-ecb', 'aes-256-cbc']

    // validate encryption mode
    if (config?.mode && !modes.includes(config?.mode?.toLowerCase())) {
        throw { message: `[Invalid]: Encryption mode '${config?.mode}' provided for column: '${value}'`, cause: 'Invalid encryption mode' }
    }

    // check secret exists or not
    if (!config?.secret) throw { message: `[Missing]: Secret key is required to decrypt column: '${value}'`, cause: 'Secret key is missing' }

    if (ctx?.isPostgreSQL) {
        values.push(config?.secret)
        values.push(`compress-algo=1, cipher-algo=${(config?.mode || 'aes256').toLowerCase().replace('-cbc', '').replace('-', '')}`)
        return `pgp_sym_decrypt(${placeholder}, $${ctx._variableCount++}, $${ctx._variableCount++})`;
    }

    // check iv (in 'cbc' mode) exists or not
    if (!config.iv && config?.mode.includes('cbc')) throw { message: `[Missing]: Initialization Vector (iv) is required (in '${config?.mode}') to decrypt column: '${value}'`, cause: 'Initialization Vector (iv) is missing' }
    values.push(config?.secret)
    if (config?.mode?.includes('cbc')) values.push(config?.iv)
    values.push(config?.sha || 512)
    return `CONVERT(AES_DECRYPT(${placeholder} ${config?.mode?.includes('cbc') ? ', ?' : ''}, UNHEX(SHA2(?, ?))) USING ${encoding})`
}

/**
 * patch limit/offset
 * @function patchLimit
 * @param {number} [limit] 
 * @param {Array} values
 * @param {*} ctx 
 * @param {'LIMIT'|'OFFSET'} [key=LIMIT] 
 * @returns {string}
 */
const patchLimit = (limit, values, ctx, key = 'LIMIT') => {
    values.push(limit)
    return `${key} ${ctx.isPostgreSQL ? `$${ctx._variableCount++}` : '?'}`
}

/**
 * @function prepPadding
 * @description adds padding to either side of the string
 * @param {*} param0 
 * @returns {string}
 */
const prepPadding = ({ sql, pattern, length, values, side = 'L', ctx }) => {

    // handle if padding length is missing
    if (!length) throw { message: `[Missing]: Right padding 'length' is required!`, cause: `String padding 'length' property is required inside 'padding->${side == 'L' ? 'left' : 'right'}'` }

    // handle if padding pattern is missing
    if (!pattern) throw { message: `[Missing]: Right padding 'pattern' is required!`, cause: `String padding 'pattern' property is required inside 'padding->${side == 'L' ? 'left' : 'right'}'` }

    // handle sqlite not supported
    if (ctx?.isSQLite) throw { message: `Padding not supported by 'sqlite'`, cause: `'${side}PAD' is not a part of 'sqlite'` }

    values.push(length, pattern)
    return `${side}PAD(${sql} ${ctx?.isPostgreSQL ? `, $${ctx._variableCount++}, $${ctx._variableCount++}` : ', ?, ?'})`
}

const prepSubStr = ({ length, start, sql, values, ctx }) => {
    // handle if substr length is missing
    if (!length) throw { message: `[Missing]: Sub-string 'length' is missing!`, cause: "Sub-string 'length' property is required inside 'substr'" }

    // handle if substr start index is missing
    if (!start && start != 0) throw { message: `[Missing]: Sub-string 'start' index is missing!`, cause: "Sub-string 'start' (index) property is required inside 'substr'" }

    values.push(start, length)
    return `SUBSTR(${sql}, ${prepPlaceholder({ value: start, ctx })}, ${prepPlaceholder({ value: length, ctx })})`
}

const patchDateCast = value => !value ? '' : (value.includes('-') && value.includes(':') ? '::timestamp' : (value.includes('-') ? '::date' : (value.includes(':') ? '::time' : '')))

const handlePlaceholder = ({ value, alias, junction = 'and', parent = null, encryption, ctx, values }) => {
    if (Array.isArray(value)) {
        return prepSelect({ select: value, values, alias, encryption, ctx })
    }
    if (typeof value === 'object' && value != null) {
        return prepWhere({ alias, where: value, junction, parent, values, encryption, ctx })
    }
    else {
        const placeholder = prepPlaceholder({ value, alias, ctx })
        if (isVariable(placeholder)) values.push(prepName({ value, alias, ctx }))
        return placeholder
    }
}

const handleAndOr = ({ key, val, alias, junction, parent, values, encryption, ctx }) => {
    const resp = val.map(condition => prepWhere({ alias, where: condition, junction, parent, values, encryption, ctx })).filter(Boolean).map(condition => `(${condition})`)
    return resp.length > 1 ? `(${resp.join(junctions[key])})` : resp.join(junctions[key])
}

const handleBetween = ({ alias, val, junction, parent, values, encryption, ctx }) => {
    let sql = ''
    const { gt, lt } = val
    if (parent && !(parent in conditions)) {
        sql = prepPlaceholder({ value: parent, alias, ctx })
        if (isVariable(sql)) values.push(prepName({ alias, value: parent, ctx }))
    }
    const gtPlaceholder = handlePlaceholder({ value: gt, alias, junction, values, encryption, ctx })
    const ltPlaceholder = handlePlaceholder({ value: lt, alias, junction, values, encryption, ctx })
    return `${sql} BETWEEN ${gtPlaceholder} AND ${ltPlaceholder}`
}

const replaceDatePatterns = ({ format, dialect = 'mysql' }) => {
    const formatMap = {
        d: { mysql: '%e', postgresql: 'FMDD', sqlite: '%e' },
        dd: { mysql: '%d', postgresql: 'DD', sqlite: '%d' },
        D: { mysql: '%D', postgresql: 'FMDDth', sqlite: '%d' },
        dy: { mysql: '%a', postgresql: 'Dy', sqlite: '%w' },
        Dy: { mysql: '%W', postgresql: 'FMDay', sqlite: "%u" },
        dow: { mysql: '%w', postgresql: 'ID', sqlite: '%w' },
        doy: { mysql: '%j', postgresql: 'DDD', sqlite: '%j' },
        M: { mysql: '%c', postgresql: 'FMmm', sqlite: '%m' },
        MM: { mysql: '%m', postgresql: 'MM', sqlite: '%m' },
        Mon: { mysql: '%b', postgresql: 'Mon', sqlite: '%m' },
        MON: { mysql: '%M', postgresql: 'FMMonth', sqlite: '%m' },
        y: { mysql: '%y', postgresql: 'YY', sqlite: '%Y' },
        Y: { mysql: '%Y', postgresql: 'YYYY', sqlite: '%Y' },
        H: { mysql: '%k', postgresql: 'FMHH24', sqlite: '%H' },
        HH: { mysql: '%H', postgresql: 'HH24', sqlite: '%H' },
        h: { mysql: '%l', postgresql: 'FMHH12', sqlite: '%I' },
        hh: { mysql: '%h', postgresql: 'HH12', sqlite: '%I' },
        m: { mysql: '%i', postgresql: 'MI', sqlite: '%M' },
        mm: { mysql: '%i', postgresql: 'MI', sqlite: '%M' },
        s: { mysql: '%S', postgresql: 'SS', sqlite: '%S' },
        ss: { mysql: '%S', postgresql: 'SS', sqlite: '%S' },
        ms: { mysql: '%f', postgresql: 'US', sqlite: '%f' },
        a: { mysql: '%p', postgresql: 'am', sqlite: '%p' },
        A: { mysql: '%p', postgresql: 'AM', sqlite: '%p' },
        w: { mysql: '%u', postgresql: 'WW', sqlite: '%W' },
        q: { mysql: '%q', postgresql: 'Q', sqlite: 'q' },
        TZ: { mysql: '%Z', postgresql: 'TZ', sqlite: 'TZ' },
        tz: { mysql: '%z', postgresql: 'TZH:TZM', sqlite: 'tz' }
    }
    const keys = Object.keys(formatMap).sort((a, b) => b.length - a.length)

    let result = ''
    for (let i = 0; i < format.length;) {
        if (format[i] === '[') {
            const end = format.indexOf(']', i)
            if (end === -1) throw new Error('Unclosed [literal]')
            result += format.slice(i + 1, end)
            i = end + 1
        } else {
            let matched = false
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j]
                if (format.startsWith(key, i)) {
                    result += formatMap[key][dialect]
                    i += key.length
                    matched = true
                    break
                }
            }
            if (!matched) {
                result += format[i]
                i++
            }
        }
    }

    return result
}

const handleFunc = {
    and: handleAndOr,
    or: handleAndOr,
    between: handleBetween,
    if: prepIf,
    case: prepCase,
    join: prepJoin,
    json: prepJson,
    refer: prepRefer,
    concat: prepConcat,
    date: prepDate,
    str: prepString,
    num: prepNumeric,
    sum: prepAggregate,
    avg: prepAggregate,
    count: prepAggregate,
    max: prepAggregate,
    min: prepAggregate,
}

module.exports = { prepSelect, prepWhere, prepJoin, prepOrderBy, isVariable, patchGroupBy, patchLimit, prepEncryption }