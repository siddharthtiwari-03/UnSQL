const { colors } = require("./console.helper")
const { conditions, checkConstants } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchToArray, patchInline } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareCondition = ({ alias, key, value, parent = null, junction, encryption = null, ctx = null }) => {
    console.group(colors.magenta, 'prepare conditions invoked', colors.reset)

    console.log('alias', alias)
    console.log('key', key)
    console.log('value', value)
    console.log('parent', parent)

    let sql = ''
    const values = []

    switch (true) {

        case key === 'decrypt': {
            console.group(colors.bgMagenta, 'decrypt key is detected', colors.reset)
            console.log('parent', parent)
            console.log('key', key)
            console.log('value', value)

            const { value: v, condition, secret = null, iv = null, sha = 512 } = value

            sql += 'AES_DECRYPT(??, '
            values.push(v)

            if (ctx?.config?.encryption?.mode === 'aes-256-cbc') {
                sql += `SHA2(?, ${parseInt(sha) || 512}), ?)`
                if (!iv) {
                    console.error(colors.red, `Initialization Vector iv is required with ${ctx?.config?.encryption?.mode} mode`, colors.reset)
                    throw new Error(`Initialization Vector iv is required with ${ctx?.config?.encryption?.mode} mode`)
                }
                values.push(secret, iv)

            } else {
                sql += `UNHEX(SHA2(?, ${parseInt(sha) || 512})))`
                values.push(secret)
            }
            const resp = prepareCondition({ alias, key: 'UnSQLPlaceholder', value: condition, ctx })
            console.log('resp inside decrypt block', resp)
            sql += resp.sql
            values.push(...resp.values)

            console.groupEnd()
            break
        }

        case !Array.isArray(value) && typeof value === 'object': {
            console.group(colors.bgBlue, 'value is an object', colors.reset)


            const localLoop = Object.entries(value).map(([k, v]) => {

                console.group('looping entries of value object')

                console.log('k', k)
                console.log('v', v)

                const localResp = prepareCondition({ alias, value: v, key: k, parent: key, ctx })
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

            if (parent != 'UnSQLPlaceholder') {
                const nm = prepareName({ alias, value: parent })
                const placeholder = preparePlaceholder(parent)
                sql += placeholder
                patchToArray(values, !checkConstants(parent), nm)
            }
            sql += conditions[key]

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
            console.group(colors.bgGreen, 'value is array of multiple items', colors.reset)

            console.log('parent', parent)
            console.log('key', key)
            console.log('value', value)

            if (key != 'UnSQLPlaceholder') {
                const name = prepareName({ alias, value: key })
                const placeholder = preparePlaceholder(key)
                sql += placeholder
                patchToArray(values, !checkConstants(key), name)
            }
            sql += ' IN ('

            sql += value?.map(val => {
                const nm = prepareName({ alias, value: val })
                const valPlaceholder = preparePlaceholder(val)
                patchToArray(values, !checkConstants(val), nm)
                return valPlaceholder
            })

            sql += ')'

            console.groupEnd()
            break
        }

        case typeof value === 'number':
        case typeof value === 'string':
        case Array.isArray(value) && value?.length === 1: {
            console.group(colors.bgYellow, 'value is', typeof value, colors.reset)
            console.log('parent', parent)
            console.log('key', key)
            console.log('value', value)

            if (key != 'UnSQLPlaceholder') {
                const name = prepareName({ alias, value: key })
                const placeholder = preparePlaceholder(key)
                sql += placeholder
                patchToArray(values, !checkConstants(key), name)
            }
            const valueName = prepareName({ alias, value })
            const valuePlaceholder = preparePlaceholder(value)

            sql += ' = ' + valuePlaceholder
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