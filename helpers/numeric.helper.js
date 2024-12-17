const { colors } = require("./console.helper")
const { checkConstants, dataTypes, numericFunctions } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareNumeric = ({ alias, key, value }) => {

    console.group(colors.green, 'prepare numeric invoked', colors.reset)

    let sql = ''
    const values = []

    const { value: v, power, divideBy, multiplyBy, mod, decimals, round, cast, as } = value

    const name = prepareName({ alias, value: v })
    const placeholder = preparePlaceholder(v)


    // apply casting
    sql += patchInline(cast in dataTypes, 'CAST(')

    // apply format method to limit to decimal values
    sql += patchInline(parseInt(decimals) > -1, 'FORMAT(')

    // apply ceil method to round to next greater value
    sql += patchInline(decimals === 'ceil', 'CEIL(')

    // apply floor method to round to previous smaller value
    sql += patchInline(decimals === 'floor', 'FLOOR(')

    // apply round method to round to previous smaller value
    sql += patchInline(decimals === 'round', 'ROUND(')

    // apply bracket for multiplication
    sql += patchInline(multiplyBy, '(')

    // apply bracket for modulus
    sql += patchInline(mod, '(')

    // apply bracket for division
    sql += patchInline(divideBy, '(')

    // apply bracket for power of
    sql += patchInline(power, 'POWER(')

    switch (true) {

        case key === 'pi': {
            sql += 'PI()'
            break
        }


        case key === 'least': {

            if (!Array.isArray(v)) {
                console.error(colors.red, 'Method "Least" accepts value parameter to be an array,', typeof v, 'value provided, this method will be ignored', colors.reset)
                break
            }

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

        default: {
            console.log('default condition')

            sql += patchInline(key != 'num', numericFunctions[key] + '(')

            sql += placeholder
            patchToArray(values, !checkConstants(v), name)

            sql += patchInline(key != 'num', ')')
            break
        }

    }

    // sql += patchInline(round === true || round === 'floor' || round === 'ceil', ')')

    if (power) {
        const powerName = prepareName({ alias, value: power })
        const powerPlaceholder = preparePlaceholder(power)
        sql += `, ${powerPlaceholder})`
        patchToArray(values, !checkConstants(power), powerName)
    }

    if (divideBy) {
        const divisorName = prepareName({ alias, value: divideBy })
        const divisorPlaceholder = preparePlaceholder(divideBy)
        sql += ' / ' + divisorPlaceholder + ')'
        patchToArray(values, !checkConstants(divideBy), divisorName)
    }

    if (mod) {
        const moduloName = prepareName({ alias, value: mod })
        const moduloPlaceholder = preparePlaceholder(mod)
        sql += ' MOD ' + moduloPlaceholder + ')'
        patchToArray(values, !checkConstants(mod), moduloName)
    }

    if (multiplyBy) {
        const multiplierName = prepareName({ alias, value: multiplyBy })
        const multiplierPlaceholder = preparePlaceholder(multiplyBy)
        sql += ' * ' + multiplierPlaceholder + ')'
        patchToArray(values, !checkConstants(multiplyBy), multiplierName)
    }

    if (decimals) {
        // format end here
        // patch decimal length for format method
        sql += patchInline(parseInt(decimals) > -1, ', ?)')
        patchToArray(values, parseInt(decimals) > -1, decimals)
        sql += patchInline(decimals === 'round' || decimals === 'ceil' || decimals === 'floor', ')')
    }

    // casting end here
    sql += patchInline(cast in dataTypes, ' AS ' + dataTypes[cast] + ')')

    // patch local name here
    sql += patchInline(sql != '', ' AS ?')
    patchToArray(values, sql != '', patchInline(as, as, patchInline(v?.toString()?.includes('.'), v?.toString()?.split('.')[1], v)))

    console.group(colors.green, 'prepare numeric ends', colors.reset)
    console.groupEnd()

    return { sql, values }
}

module.exports = { prepareNumeric }