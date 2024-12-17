const { prepareCondition } = require("./condition.helper")
const { colors } = require("./console.helper")
const { checkConstants, junctions } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchToArray, patchInline } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareWrapper = ({ alias, key, value }) => {

    console.group('wrapper invoked')

    const values = []
    let sql = ''

    switch (true) {

        case key === 'array':
        case key === 'json': {

            console.log('json object')
            console.log('key', key)
            console.log('value')
            console.dir(value)

            const { value: val, from, alias: a, where = {}, as } = value

            sql += patchInline(from, '(SELECT ')

            // json object method start here
            sql += patchInline(key === 'array', 'JSON_ARRAYAGG(')
            sql += patchInline(key === 'array' && Array.isArray(val), 'JSON_ARRAY(')
            sql += patchInline(key === 'json' || !Array.isArray(val), 'JSON_OBJECT(')

            sql += Object.entries(val).map(([k, v]) => {
                const name = prepareName({ alias: a, value: v })
                const placeholder = preparePlaceholder(v)

                patchToArray(values, !Array.isArray(val), k)
                patchToArray(values, !checkConstants(v), name)
                return patchInline(!Array.isArray(val), '?, ') + placeholder
            }).join(', ')
            // sql += patchInline(key === 'array', ', JSON_ARRAY()')
            sql += patchInline(key === 'json' || !Array.isArray(val), ')')
            sql += patchInline(key === 'array' && Array.isArray(val), ')')
            sql += patchInline(key === 'array', ')')
            // json object method end here

            if (from) {
                sql += ' FROM ?? '
                values.push(from)
                if (a) {
                    sql += '?? '
                    values.push(a)
                }
            }
            if (Object.keys(where).length) {
                sql += 'WHERE '
                const whereResp = prepareWhere({ alias: a, where, junction: 'and' })
                sql += whereResp.sql
                values.push(...whereResp.values)
            }

            sql += patchInline(from, ')')

            sql += ' AS ? '
            values.push(as || 'json')
            break
        }

    }

    console.groupEnd()
    return { sql, values }
}


const prepareWhere = ({ alias, where, parent = null, junction }) => {
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
                console.log('default where clause invoked')
                const resp = prepareCondition({ alias, key, value })
                console.log('resp from prepare condition', resp)

                // return
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

module.exports = { prepareWrapper }