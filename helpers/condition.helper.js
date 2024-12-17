const { colors } = require("./console.helper")
const { conditions, checkConstants } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchToArray, patchInline } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareCondition = ({ alias, key, value, parent = null, junction }) => {
    console.group(colors.magenta, 'prepare conditions invoked', colors.reset)

    console.log('alias', alias)
    console.log('key', key)
    console.log('value', value)
    console.log('parent', parent)

    let sql = ''
    const values = []

    switch (true) {

        case !Array.isArray(value) && typeof value === 'object': {
            console.group(colors.bgBlue, 'value is an object', colors.reset)


            const localLoop = Object.entries(value).map(([k, v]) => {

                console.group('looping entries of value object')

                console.log('k', k)
                console.log('v', v)

                const localResp = prepareCondition({ alias, value: v, key: k, parent: key })
                console.log('localResp', localResp)
                values.push(...localResp.values)
                console.groupEnd()
                return localResp.sql
            })

            console.log('localLoop', localLoop)
            sql += localLoop

            console.groupEnd()
            break
        }

        case key in conditions: {
            console.group(colors.bgGreen, 'key in conditions', colors.reset)
            console.log('key', key)
            console.log('value', value)

            const nm = prepareName({ alias, value: parent })
            const placeholder = preparePlaceholder(parent)

            sql += placeholder + conditions[key]
            patchToArray(values, !checkConstants(parent), nm)

            const valueName = prepareName({ alias, value })
            const valuePlaceholder = preparePlaceholder(value)

            sql += patchInline(key === 'in', '(')
            sql += patchInline(key === 'like' || key === 'notLike' || key === 'endLike' || key === 'notEndLike', 'CONCAT("%", ')
            sql += valuePlaceholder
            sql += patchInline(key === 'like' || key === 'notLike' || key === 'startLike' || key === 'notStartLike', ' ,"%")')
            sql += patchInline(key === 'in', ')')
            patchToArray(values, !checkConstants(value), valueName)
            console.groupEnd()
            break
        }

        case Array.isArray(value) && value?.length > 1: {
            console.log('value is array of multiple items')
            const name = prepareName({ alias, value: key })
            const placeholder = preparePlaceholder(key)

            sql += placeholder + ' IN ('
            patchToArray(values, !checkConstants(key), name)

            sql += value?.map(val => {
                const nm = prepareName({ alias, value: val })
                const valPlaceholder = preparePlaceholder(val)
                patchToArray(values, !checkConstants(val), nm)
                return valPlaceholder
            })

            sql += ')'

            break
        }

        case typeof value === 'number':
        case typeof value === 'string':
        case Array.isArray(value) && value?.length === 1: {
            console.group('value is', typeof value)
            const name = prepareName({ alias, value: key })
            const placeholder = preparePlaceholder(key)

            const valueName = prepareName({ alias, value })
            const valuePlaceholder = preparePlaceholder(value)

            sql += placeholder + ' = ' + valuePlaceholder
            patchToArray(values, !checkConstants(key), name)
            patchToArray(values, !checkConstants(value), valueName)

            console.groupEnd()
            break

        }

        default: {
            console.log(colors.bgBlue, 'default conditional block invoked', colors.reset)
            break
        }

    }

    console.groupEnd()

    return { sql, values }
}

module.exports = { prepareCondition }