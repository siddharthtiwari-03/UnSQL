const { colors } = require("./console.helper")
const { checkConstants, dateUnits, dateFunctions } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareDate = ({ alias, key, value, encryption = null, ctx = null }) => {

    console.group('prepare date invoked')

    console.log('key', key)
    console.log('value', value)

    let sql = ''
    const values = []

    const { value: v, add, sub, pattern, offset, over, window, format, decrypt, as } = value

    // const interval = patchInline(add, add?.match(/\d+/g)) || patchInline(sub, sub?.match(/\d+/g)) || null
    const addInterval = patchInline(add, parseFloat(add)) || null
    const subInterval = patchInline(sub, parseFloat(sub)) || null
    const addUnit = patchInline(add, typeof add === 'string' && add?.match(/[a-z]+/ig)) || null
    const subUnit = patchInline(sub, typeof sub === 'string' && sub?.match(/[a-z]+/ig)) || null

    console.log('addInterval', addInterval)
    console.log('subInterval', subInterval)
    console.log('addUnit', addUnit)
    console.log('subUnit', subUnit)

    const name = prepareName({ alias, value: v })
    console.log('name', name)
    const placeholder = preparePlaceholder(v)
    console.log('placeholder', placeholder)

    // wrap date to date_format function if 'format' provided
    sql += patchInline(format && (key === 'time' || key === 'timeFormat'), 'TIME_FORMAT(')
    sql += patchInline(format && (key != 'time' || key === 'dateFormat'), 'DATE_FORMAT(')

    // add / subtract date method start here
    sql += patchInline(sub || (sub && key === 'subDate'), 'SUBDATE(')
    sql += patchInline(add || (add && key === 'addDate'), 'ADDDATE(')

    // add / subtract time method start here
    sql += patchInline(sub && key === 'subTime', 'SUBTIME(')
    sql += patchInline(add && key === 'addTime', 'ADDTIME(')

    switch (true) {

        case checkConstants(key): {
            console.log('key is date constant function')
            sql += dateFunctions[key] + '()'
            break
        }

        case key === 'strToDate': {
            sql += dateFunctions[key] + '(' + placeholder + ', ?)'
            values.push(name)
            values.push(pattern)
            break
        }

        case key === 'addDate':
        case key === 'subDate':
        case key === 'dateFormat':
        case key === 'timeFormat': {
            console.log('date time formatter detected', key)
            sql += placeholder
            patchToArray(values, !checkConstants(v), name)
            break
        }

        case key === 'dateDiff':
        case key === 'timeDiff': {
            console.log('date / time difference')
            if (Array.isArray(v)) {
                const [startDate, endDate] = v

                const startName = prepareName({ alias, value: startDate })
                const endName = prepareName({ alias, value: endDate })

                const startPlaceholder = preparePlaceholder(startDate)
                const endPlaceholder = preparePlaceholder(endDate)

                sql += dateFunctions[key] + '(' + startPlaceholder + ', ' + endPlaceholder + ')'

                patchToArray(values, !checkConstants(startDate), startName)
                patchToArray(values, !checkConstants(endDate), endName)

            } else {
                console.error(colors.red, key, 'expects value to be an array,', typeof key, 'type value provided, this method will be ignored', colors.reset)
            }
            break
        }

        case key === 'least': {
            sql += 'LEAST('
            sql += v.map(val => {
                const n = prepareName({ alias, value: val })
                const placeholder = preparePlaceholder(val)
                patchToArray(values, !checkConstants(val), n)
                return placeholder
            })
            sql += ')'
            break
        }

        case key === 'lead':
        case key === 'lag': {
            console.log('lead / lag detected')

            sql += dateFunctions[key] + '(' + placeholder + ')'
            patchToArray(values, !checkConstants(v), name)

            sql += ' OVER ('

            if (typeof window === 'object') {

                const { orderBy } = window

                // sql

            } else if (window) {
                sql += ' ?? '
                values.push(window)
            }

            sql += ')'

            break
        }

        default: {
            console.log('default date function')

            sql += patchInline(key != 'date', dateFunctions[key] + '(')

            // decryption method start here
            sql += patchInline(decrypt, 'AES_DECRYPT(')

            // ##################################################

            sql += placeholder
            patchToArray(values, !checkConstants(v), name)

            // ##################################################

            // handle decryption method block start here 
            if (decrypt) {

                // handle if local query encryption mode is set
                if (encryption?.mode) {

                    sql += patchInline(encryption?.mode?.includes('-cbc'), ', ?')
                    sql += ', UNHEX(SHA2(?, ?))'

                    values.push(decrypt?.secret || encryption?.secret || ctx?.config?.encryption?.secret)

                    // check if encryption mode requires iv or sha
                    if (encryption?.mode?.includes('-cbc')) {
                        values.push(decrypt?.iv || encryption?.iv || ctx?.config?.encryption?.iv)
                    }

                    values.push(decrypt?.sha || encryption?.sha || ctx?.config?.encryption?.sha || 512)

                }
                // handle if global encryption mode is set
                else if (ctx?.config?.encryption?.mode) {

                    sql += patchInline(ctx?.config?.encryption?.mode?.includes('-cbc'), ', ?')

                    sql += ', UNHEX(SHA2(?, ?))'

                    values.push(decrypt?.secret || encryption?.secret || ctx?.config?.encryption?.secret)

                    // check if encryption mode requires iv or sha
                    if (ctx?.config?.encryption?.mode?.includes('-cbc')) {
                        values.push(decrypt?.iv || encryption?.iv || ctx?.config?.encryption?.iv)
                    }

                    values.push(decrypt?.sha || encryption?.sha || ctx?.config?.encryption?.sha || 512)

                }

                sql += ')'

            }
            // handle decryption method block end here 


            sql += patchInline(key != 'date', ')')


            break
        }

    }

    // patching if only addInterval is provided
    if (addInterval) {

        if (!addUnit) {
            sql += ', ?'
        } else {
            sql += ', INTERVAL ? '
            sql += dateUnits[addUnit]
        }

        values.push(addInterval)

    }
    sql += patchInline(add || key === 'addDate', ')')

    // patching if only subInterval is provided
    if (subInterval) {

        if (!subUnit) {
            sql += ', ?'
        } else {
            sql += ', INTERVAL ? '
            sql += dateUnits[subUnit]
        }

        values.push(subInterval)

    }
    // add / subtract date / time method start here
    sql += patchInline(sub || key === 'subDate', ')')

    // patch format
    if (format) {
        sql += ', ?)'
        values.push(format)
    }

    // patch local name here
    if (sql != '') {
        sql += ' AS ?'
        values.push(patchInline(as, as, patchInline(v.includes('.'), v.split('.')[1], v)))
    }

    console.groupEnd()

    return { sql, values }

}

module.exports = { prepareDate }