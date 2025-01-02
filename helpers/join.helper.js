const { prepareCondition } = require("./condition.helper")
const { colors } = require("./console.helper")
const { joinTypes, junctions } = require("./constants.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")
const { prepareSelect } = require("./select.helper")

const prepareJoin = ({ alias, join, ctx = null }) => {
    console.group('prepare join invoked')

    const values = []

    const resp = join.map(j => {
        console.log('join object inside map loop', j)
        const { table, alias: a, type, select = [], join: nestedJoin = [], where = {}, using = [], as = null } = j
        let sql = ''

        if (!table) {
            console.error(colors.red, "Parameter 'table' with table name is required in the join clause", colors.reset)
            // return { success: false, error: 'Parameter "table" with table name is required in the join clause' }
            throw new Error('Parameter: table with table name is required in the join clause')
            return ''
        }

        sql += `${(joinTypes[type] && (' ' + joinTypes[type])) || ''} JOIN `

        if (select.length || (nestedJoin.length)) {
            console.group(colors.yellow, 'inner join invoked', colors.reset)
            sql += '(SELECT '
            const selectResp = prepareSelect({ alias: a, select })
            sql += selectResp.sql
            values.push(...selectResp.values)

            sql += ' FROM ?? ?? '
            values.push(table, a)


            const joinResp = prepareJoin({ alias: a, join: nestedJoin })
            sql += joinResp.sql
            values.push(...joinResp.values)

            if (Object.keys(where).length) {
                console.log(colors.yellow, 'where found', colors.reset)

                sql += ' WHERE '
                const whereResp = prepareWhere({ alias: a, where, junction: 'and' })
                console.log('where resp', whereResp)
                sql += whereResp.sql
                values.push(...whereResp?.values)

            }

            sql += ') ' + patchInline(as, '?? ')
            patchToArray(values, as, as)
            console.groupEnd()
        } else {

            sql += '?? '
            values.push(table)

            if (a) {
                sql += '?? '
                values.push(a)
            }

        }


        if (using.some(u => typeof u === 'object')) {

            sql += 'ON '
            sql += using.map(u => {
                const [[primaryCol, secondaryCol]] = Object.entries(u)
                patchToArray(values, alias, alias + '.' + primaryCol, primaryCol)
                patchToArray(values, as || a, (as || a) + '.' + secondaryCol, secondaryCol)
                return '?? = ??'
            }).join(' AND ')

        } else if (using.length) {
            sql += 'USING('
            sql += using.map(u => {
                values.push(u)
                return '??'
            }).join(', ')
            sql += ')'
        }

        return sql
    })

    console.log('resp after join loop', resp)

    console.groupEnd()

    return { sql: resp.join(' '), values }
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

module.exports = { prepareJoin }