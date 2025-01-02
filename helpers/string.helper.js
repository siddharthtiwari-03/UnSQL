const { colors } = require("./console.helper")
const { stringFunctions, checkConstants, dataTypes } = require("./constants.helper")
const { prepareName, extractName } = require("./name.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareString = ({ alias, key, value, encryption = null, ctx = null }) => {

    console.group(colors.blue, 'prepare string method invoked', colors.reset)

    console.log('key', key)
    console.log('value', value)

    let sql = ''
    const values = []

    const { value: v, case: c, search, pattern = '', substr = [], pad = [], decimals, reverse, cropLeft, cropRight, trim, repeat, replace = [], decrypt = { secret: null, iv: null, sha: 512 }, cast, as } = value


    const [padDirection, padding, padStr] = pad

    const [startIndex, endIndex, delimiter, offsetIndex] = substr

    const [identifier, replaceWith] = replace

    console.log('search', search)

    const name = prepareName({ alias, value: v })
    const placeholder = preparePlaceholder(v)

    // replace method start here
    sql += patchInline(identifier && replaceWith, 'REPLACE(')

    // repeat method start here
    sql += patchInline(parseInt(repeat), 'REPEAT(')

    // upper / lower case start here
    sql += patchInline(c === 'upper' || c === 'lower', stringFunctions[c] + '(')

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
    sql += patchInline(substr.length, 'SUBSTRING(')

    // trim start here
    sql += patchInline(trim === 'left', 'LTRIM(')
    sql += patchInline(trim === 'right', 'RTRIM(')
    sql += patchInline(trim === true, 'TRIM(')

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
            sql += patchInline(cast in dataTypes || decrypt?.secret, 'CAST(')

            // decryption method start here
            sql += patchInline(decrypt, 'AES_DECRYPT(')

            // ##################################################

            // patch main value with placeholder
            sql += placeholder
            patchToArray(values, !checkConstants(v), name)

            // ##################################################

            // handle decryption method block starts here
            if (decrypt) {
                // console.log('ctx', ctx)
                console.log('encryption', encryption)

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
            // handle decryption method block ends here

            sql += patchInline(key != 'str', ')')

            // casting end here
            sql += patchInline(cast in dataTypes || decrypt?.secret, ' AS ' + (dataTypes[cast] || 'CHAR') + ')')

            console.groupEnd()
            break
        }

    }

    // trim end here
    sql += patchInline(trim === 'left' || trim === 'right' || trim == true, ')')

    // patch substring method
    if (substr.length) {
        sql += ', ?, ?)'
        values.push(startIndex || 1)
        values.push(endIndex || 1)
    }

    // patch crop right ends here
    if (parseInt(cropRight)) {
        sql += ', ?)'
        values.push(cropRight)
    }

    // patch crop left ends here
    if (parseInt(cropLeft)) {
        sql += ', ?)'
        values.push(cropLeft)
    }

    // reverse method end here
    sql += patchInline(reverse, ')')

    // patch search criteria
    if (search) {
        const sn = prepareName({ alias, value: search })
        const sp = preparePlaceholder(search)
        sql += ', ' + sp + ')'
        patchToArray(values, !checkConstants(search), sn)
    }

    // format end here
    if (typeof decimals === 'number' || decimals === 'floor' || decimals === 'ceil' || decimals === 'round') {
        // patch decimal length for format method
        sql += ', ?)'
        values.push(decimals)
    }

    if (padding && (padDirection === 'left' || padDirection === 'right')) {
        sql += ', ?)'
        values.push(padding)
    }

    if (padStr && (padDirection === 'left' || padDirection === 'right')) {
        sql += ', ?)'
        values.push(padStr)
    }

    // upper / lower case end here
    sql += patchInline(c === 'upper' || c === 'lower', ')')

    // repeat method end here
    if (parseInt(repeat)) {
        sql += ', ?)'
        values.push(repeat)
    }

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
    if (sql != '') {
        sql += ' AS ?'
        values.push(patchInline(as, as, extractName(v)))
    }

    console.groupEnd()

    return { sql, values }

}

module.exports = { prepareString }