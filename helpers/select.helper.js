const { prepareCondition } = require("./condition.helper")
const { colors } = require("./console.helper")
const { checkConstants, dateFunctions, stringFunctions, numericFunctions, advanceFunctions, junctions } = require("./constants.helper")
const { prepareDate } = require("./date.helper")
const { prepareName } = require("./name.helper")
const { prepareNumeric } = require("./numeric.helper")
const { patchToArray, patchInline } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")
const { prepareString } = require("./string.helper")
const { prepareWrapper } = require("./wrap.helper")

/**
 * @param {Object} selectObj
 * 
 * @param {string} selectObj.alias
 * @param {Array} selectObj.select
 * @param {import("../defs/types.def").encryption} selectObj.encryption
 * @param {*} selectObj.ctx
 * @returns 
 */
const prepareSelect = ({ alias, select, encryption = null, ctx = null }) => {

    // let sql = ''

    console.group(colors.magenta, 'prepare select invoked', colors.reset)

    const values = []

    const res = select.map(selectable => {
        console.group('select loop')
        console.log(colors.magenta, 'selectable', selectable, colors.reset)

        if (typeof selectable === 'object' && !Array.isArray(selectable)) {
            console.group('selectable is an object')
            console.dir(selectable)

            const [[key, value]] = Object.entries(selectable)

            console.log('key', key)
            console.log('value', value)

            switch (true) {

                // case key === 'dt':
                case key in dateFunctions: {
                    console.log(colors.magenta, 'selectable key is in date function', colors.reset)
                    const resp = prepareDate({ alias, key, value, encryption, ctx })
                    console.log('date resp', resp)
                    if (resp?.values?.length) values.push(...resp.values)
                    console.groupEnd() // selectable group ends here
                    console.groupEnd() // select loop group ends here
                    return resp?.sql
                }

                case key === 'str':
                case key in stringFunctions: {
                    console.log(colors.magenta, 'selectable key is in string function', colors.reset)
                    const resp = prepareString({ alias, key, value, encryption, ctx })
                    if (resp?.values?.length) values.push(...resp.values)
                    console.groupEnd() // selectable group ends here
                    console.groupEnd() // select loop group ends here
                    return resp?.sql
                }

                case key === 'num':
                case key in numericFunctions: {
                    console.log(colors.magenta, 'selectable key is in numeric function', colors.reset)
                    const resp = prepareNumeric({ alias, key, value, encryption, ctx })
                    console.log('resp', resp)
                    values.push(...resp.values)
                    console.groupEnd() // selectable group ends here
                    console.groupEnd() // select loop group ends here
                    return resp.sql
                }

                case key in advanceFunctions: {
                    console.log(colors.magenta, 'selectable key is in advance function', colors.reset)
                    console.groupEnd() // selectable group ends here
                    console.groupEnd() // select loop group ends here
                    return
                }

                case key === 'json':
                case key === 'array': {
                    const resp = prepareWrapper({ alias, key, value, ctx })
                    values.push(...resp.values)
                    return resp.sql
                }

                case key === 'find': {
                    console.group(colors.cyan, 'nested find invoked', colors.reset)
                    const { select: subSelect = [], from, alias: a, where = {}, as } = value

                    let sql = '(SELECT '

                    const selectResp = prepareSelect({ alias: a, select: subSelect, ctx })
                    sql += selectResp.sql
                    values.push(...selectResp.values)

                    sql += ' FROM ?? '
                    values.push(from)

                    if (a) {
                        sql += '?? '
                        values.push(a)
                    }

                    if (Object.keys(where).length) {
                        sql += 'WHERE '
                        const whereResp = prepareWhere({ alias: a, where, junction: 'and' })
                        sql += whereResp.sql
                        values.push(...whereResp.values)
                    }

                    sql += ') AS ? '
                    values.push(as || 'find')

                    console.group()
                    return sql
                }

                default: {
                    console.log(colors.magenta, 'selectable is default', colors.reset)
                    const name = prepareName({ alias, value: key })
                    const placeholder = preparePlaceholder(key)
                    patchToArray(values, !checkConstants(key), name)
                    values.push(value)
                    console.groupEnd() // selectable group ends here
                    console.groupEnd() // select loop group ends here
                    return placeholder + ' AS ?'
                }

            }
        }

        const placeholder = preparePlaceholder(selectable)
        console.log('placeholder', placeholder)

        const name = prepareName({ alias, value: selectable })

        patchToArray(values, !checkConstants(selectable), name)
        // if (!checkConstants(selectable)) values.push(selectable)
        console.groupEnd() // select loop group ends here
        return placeholder


    })

    let sql = res.filter(s => !!s).join(', ') || '*' // handle fallback of 'select alias.*' case if nothing is provided

    console.log('sql inside select helper', sql)
    // patching alias only to handle 'alias.*' case
    patchToArray(values, alias && sql === '??.*', alias)
    console.groupEnd() // main group ends here

    return { sql, values }
}


const prepareWhere = ({ alias, where, parent = null, junction, ctx = null }) => {
    console.group(colors.magenta, 'prepare where invoked', colors.reset)

    console.log('alias', alias)
    console.log('where', where)

    const values = []

    const entriesResp = Object.entries(where).map(([key, value]) => {

        let sql = ''

        console.log('key', key)
        console.log('value', value)

        switch (true) {

            case key === 'and':
            case key === 'or': {
                console.log('handle and / or condition in where block invoked')

                const mapResp = value.map(val => {

                    console.log('val inside and / or map', val)

                    const resp = prepareWhere({ alias, where: val, junction })

                    console.log('resp inside loop', resp)
                    values.push(...resp.values)
                    return resp.sql
                })

                console.log('mapResp', mapResp)
                sql += patchInline(mapResp.length > 1, '(') + mapResp.join(junctions[key]) + patchInline(mapResp.length > 1, ')')

                break
            }

            default: {
                console.log(colors.bgRed, 'default where clause invoked', colors.reset)
                console.log('key', key)
                console.log('value', value)

                const resp = prepareCondition({ alias, key, value, ctx })
                console.log('resp from prepare condition', resp)

                sql += resp.sql

                values.push(...resp.values)

                break
            }

        }

        return sql

    })

    console.log('entriesResp', entriesResp)

    console.groupEnd()

    return { sql: patchInline(entriesResp.length > 1, '(') + entriesResp.join(junctions[junction]) + patchInline(entriesResp.length > 1, ')'), values }
}


module.exports = { prepareSelect }