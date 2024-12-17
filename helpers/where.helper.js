const { prepareCondition } = require("./condition.helper")
const { colors } = require("./console.helper")
const { junctions } = require("./constants.helper")
const { patchInline } = require("./patch.helper")

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
                console.log(colors.bgRed, 'default where clause invoked', colors.reset)
                console.log('key', key)
                console.log('value', value)

                const resp = prepareCondition({ alias, key, value })
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

module.exports = { prepareWhere }