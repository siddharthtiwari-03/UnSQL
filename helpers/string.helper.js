const { colors } = require("./console.helper")
const { stringFunctions, checkConstants, dataTypes } = require("./constants.helper")
const { prepareName, extractName } = require("./name.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareString = ({ alias, key, value }) => {

    console.group(colors.blue, 'prepare string method invoked', colors.reset)

    console.log('key', key)
    console.log('value', value)

    let sql = ''
    const values = []

    const { value: v, case: c, search, pattern = '', substr, pad, decimals, reverse, cropLeft, cropRight, trim, repeat, replace, cast, as } = value

    const [padDirection, padding, padStr] = pad || []

    const [startIndex, endIndex, delimiter, offsetIndex] = substr || []

    const [identifier, replaceWith] = replace || []

    console.log('search', search)

    const name = prepareName({ alias, value: v })
    const placeholder = preparePlaceholder(v)

    // replace method start here
    sql += patchInline(identifier && replaceWith, 'REPLACE(')

    // repeat method start here
    sql += patchInline(parseInt(repeat), 'REPEAT(')

    // upper / lower case start here
    sql += patchInline(c === 'upper' || c === 'lower', stringFunctions[c] + '(')


    switch (true) {

        case key === 'fieldInSet':
        case key === 'field':
        case key === 'concat': {
            sql += stringFunctions[key] + '('
            sql += patchInline(key === 'concat', '?, ')
            patchToArray(values, pattern, pattern)
            sql += v.map(val => {
                const n = prepareName({ alias, value: val })
                const p = preparePlaceholder(val)
                patchToArray(values, !checkConstants(val), n)
                return p
            }).join(', ')

            sql += ')'

            break
        }

        default: {
            console.log('default string condition')
            sql += patchInline(key != 'str', stringFunctions[key] + '(')

            // apply casting
            sql += patchInline(cast in dataTypes, 'CAST(')

            // patch padding
            sql += patchInline(padding && padDirection === 'left', 'LPAD(')
            sql += patchInline(padding && padDirection === 'right', 'RPAD(')

            // patch format for decimal values
            sql += patchInline(decimals, 'FORMAT(')

            // patch instr for search values
            sql += patchInline(search, 'INSTR(')

            // patch reverse values method
            sql += patchInline(reverse, 'REVERSE(')

            // patch crop from left method
            sql += patchInline(parseInt(cropLeft), 'LEFT(')

            // patch crop from right method
            sql += patchInline(parseInt(cropRight), 'RIGHT(')

            // patch substring method
            sql += patchInline(startIndex && endIndex && !delimiter, 'SUBSTRING(')


            // trim start here
            sql += patchInline(trim === 'left', 'LTRIM(')
            sql += patchInline(trim === 'right', 'RTRIM(')
            sql += patchInline(trim === true, 'TRIM(')

            // ##################################################

            // patch main value with placeholder
            sql += placeholder
            patchToArray(values, !checkConstants(v), name)

            // ##################################################

            // trim end here
            sql += patchInline(trim === 'left' || trim === 'right' || trim == true, ')')

            // patch substring method
            sql += patchInline(startIndex, ', ?)')
            patchToArray(values, startIndex != undefined || startIndex != null, startIndex)
            sql += patchInline(endIndex, ', ?)')
            patchToArray(values, endIndex != undefined || endIndex != null, endIndex)

            // patch search criteria
            if (search) {
                const sn = prepareName({ alias, value: search })
                const sp = preparePlaceholder(search)
                sql += ', ' + sp
                patchToArray(values, !checkConstants(search), sn)
            }

            // patch crop right ends here
            sql += patchInline(cropRight, ', ?)')
            patchToArray(values, parseInt(cropRight), cropRight)

            // patch crop left ends here
            sql += patchInline(cropLeft, ', ?)')
            patchToArray(values, parseInt(cropLeft), cropLeft)

            // reverse method end here
            sql += patchInline(reverse, ')')

            // search end here
            sql += patchInline(search, ')')

            // format end here
            // patch decimal length for format method
            sql += patchInline(decimals, ', ?)')
            patchToArray(values, typeof decimals === 'number', decimals)

            sql += patchInline(padding && (padDirection === 'left' || padDirection === 'right'), ', ?)')
            patchToArray(values, padding && (padDirection === 'left' || padDirection === 'right'), padding)
            sql += patchInline(padStr && (padDirection === 'left' || padDirection === 'right'), ', ?)')
            patchToArray(values, padStr && (padDirection === 'left' || padDirection === 'right'), padStr)


            sql += patchInline(key != 'str', ')')

            // casting end here
            sql += patchInline(cast in dataTypes, ' AS ' + dataTypes[cast] + ')')

            console.groupEnd()
            break
        }

    }

    // upper / lower case end here
    sql += patchInline(c === 'upper' || c === 'lower', ')')

    // repeat method end here
    sql += patchInline(parseInt(repeat), ', ?')
    patchToArray(values, parseInt(repeat), repeat)
    sql += patchInline(parseInt(repeat), ')')

    // replace end here
    if (identifier && replaceWith) {
        const identifierName = prepareName({ alias, value: identifier })
        const identifierPlaceholder = preparePlaceholder(identifier)
        const replaceName = prepareName({ alias, value: replaceWith })
        const replacePlaceholder = preparePlaceholder(replaceWith)
        sql += `, ${identifierPlaceholder}, ${replacePlaceholder}`
        patchToArray(values, !checkConstants(identifier), identifierName)
        patchToArray(values, !checkConstants(replaceWith), replaceName)
        sql += ')'
    }
    // patch local name here
    sql += patchInline(sql != '', ' AS ?')
    patchToArray(values, sql != '', patchInline(as, as, extractName(v)))

    console.groupEnd()

    return { sql, values }

}

module.exports = { prepareString }