
const { colors } = require("./console.helper")
const { checkConstants, dataTypes } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

/**
 * performs various string based operations on the 'value' property
 * @function prepString
 * 
 * @param {object} strObj
 * 
 * @param {string} [strObj.alias] (optional) alias reference for the table name
 * 
 * @param {{
 * value: (string|string[]),
 * replace?:{'target':string, 'with':string},
 * reverse?: boolean,
 * textCase?:('upper'|'lower'),
 * padding?:{'left'?:{length:number, pattern:string}, 'right'?: {length:number, pattern:string}},
 * substr?:{start:number, length:number},
 * trim?: ('left'|'right'|boolean),
 * cast?: ('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'),
 * decrypt?:{
 * secret?:string,
 * iv?:string,
 * sha?:(224|256|384|512)},
 * as?: string
 * }} strObj.val object that holds values for different properties
 * 
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [strObj.encryption] (optional) inherits encryption config from its parent level
 * 
 * @param {*} [strObj.ctx]
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepString = ({ alias, val, encryption = undefined, ctx = undefined }) => {

    console.group('prep string invoked')

    const { value, replace, reverse, textCase, padding, substr, trim, cast, decrypt, as } = val

    let sql = ''
    const values = []

    // replace target content
    if (replace) sql += 'REPLACE('

    // reverse the output string
    if (reverse) sql += 'REVERSE('

    // change text case
    if (textCase === 'lower') sql += 'LOWER('
    else if (textCase === 'upper') sql += 'UPPER('

    // apply padding
    if (padding?.left) sql += 'LPAD('
    if (padding?.right) sql += 'RPAD('

    // substring
    if (substr) sql += 'SUBSTR('

    // trim whitespace
    if (trim === 'left') sql += 'LTRIM('
    else if (trim === 'right') sql += 'RTRIM('
    else if (trim === true) sql += 'TRIM('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // prepare place holder
    const placeholder = prepPlaceholder(value)

    // patch placeholder to the sql string
    sql += placeholder
    // patch value to values array (conditional)
    if (!checkConstants(value)) {
        const name = prepName({ alias, value })
        values.push(name)
    }

    // patch decryption extras if required
    if (decrypt) {

        if (!decrypt?.secret && encryption?.secret && ctx?.config?.encryption?.secret) {
            console.error(colors.red, 'secret is required to decrypt', colors.reset)
            throw new Error('Secret is required to decrypt!', { cause: 'Missing "secret" to decrypt inside date wrapper!' })
        }

        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
            sql += ', ?'
        }

        sql += ', UNHEX(SHA2(?, ?)))'

        values.push(decrypt?.secret || encryption?.secret || ctx?.config?.encryption?.secret)

        if (encryption?.mode?.includes('-cbc') || (!encryption?.mode && ctx?.config?.encryption?.mode?.includes('-cbc'))) {
            if (!decrypt?.iv && !encryption?.iv && !ctx?.config?.encryption?.iv) {
                console.error(colors.red, 'Initialization Vector (iv) is required to decrypt', colors.reset)
                throw new Error('Initialization Vector (iv) is required to decrypt!', { cause: 'Missing "iv" to decrypt inside date wrapper!' })
            }
            values.push(decrypt?.iv || encryption?.iv || ctx?.config?.encryption?.iv)
        }

        values.push(decrypt?.sha || encryption?.sha || ctx?.config?.encryption?.sha || 512)

    }
    // decrypt ends here

    // type casting ends here
    if (cast || decrypt) sql += ' AS ' + (dataTypes[cast] || 'CHAR') + ')'

    // trim ends here
    if (trim === 'left' || trim === 'right' || trim === true) sql += ')'

    // substring extras
    if (substr) {
        // handle if substr length is missing
        if (!substr?.length) {
            console.error(colors.red, 'Sub-string length is missing!', colors.reset)
            throw new Error('Sub-string length is missing!', { cause: "Missing 'length' property inside substr" })
        }
        // handle if substr start index is missing
        if (!substr?.start) {
            console.error(colors.red, 'Sub-string start index is missing!', colors.reset)
            throw new Error('Sub-string start index is missing!', { cause: "Missing 'start' property inside substr" })
        }

        sql += ', ? ,?)'
        values.push(substr?.start, substr?.length)
    }

    // apply right padding (extras)
    if (padding?.right) {
        sql += ', ?, ?)'
        // handle if padding length is missing
        if (!padding?.right?.length) {
            console.error(colors.red, 'Right padding length is missing!', colors.reset)
            throw new Error('Right padding length is missing!', { cause: "Missing 'length' property inside padding right" })
        }
        // handle if padding pattern is missing
        if (!padding?.right?.pattern) {
            console.error(colors.red, 'Right padding pattern is missing!', colors.reset)
            throw new Error('Right padding pattern is missing!', { cause: "Missing 'pattern' property inside padding right" })
        }
        values.push(padding?.right?.length, padding?.right?.pattern)
    }

    // apply left padding (extras)
    if (padding?.left) {
        sql += ', ?, ?)'
        // handle if padding length is missing
        if (!padding?.left?.length) {
            console.error(colors.red, 'Left padding length is missing!', colors.reset)
            throw new Error('Left padding length is missing!', { cause: "Missing 'length' property inside padding left" })
        }
        // handle if padding pattern is missing
        if (!padding?.left?.pattern) {
            console.error(colors.red, 'Left padding pattern is missing!', colors.reset)
            throw new Error('Left padding pattern is missing!', { cause: "Missing 'pattern' property inside padding left" })
        }
        values.push(padding?.left?.length, padding?.left?.pattern)
    }

    // text case ends here
    if (textCase === 'lower' || textCase === 'upper') sql += ')'

    // reverse ends here
    if (reverse) sql += ')'

    // replace target content ends here
    if (replace) {
        // handle if padding length is missing
        if (!replace?.target) {
            console.error(colors.red, 'Replace target is missing!', colors.reset)
            throw new Error('Replace target is missing!', { cause: "Missing 'target' property inside replace" })
        }
        // handle if padding pattern is missing
        if (!padding?.right?.pattern) {
            console.error(colors.red, 'Replace with string is missing!', colors.reset)
            throw new Error('Replace with string is missing!', { cause: "Missing 'with' property inside replace" })
        }
        sql += ', ?, ?)'
        values?.push(replace?.target, replace?.with)
    }

    sql += ' AS ?'
    values.push(as || (value.includes('.') ? value.split('.')[1] : value))

    console.groupEnd()
    return { sql, values }

}

module.exports = { prepString }