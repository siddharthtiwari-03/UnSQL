const { colors } = require("./console.helper")
const { checkConstants, dataTypes } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

/**
 * performs numeric operations on the 'value' property
 * @function prepNumeric
 * 
 * @param {object} numObj
 * 
 * @param {string} [numObj.alias] (optional) alias reference for the table name
 * 
 * @param {{
 * value: string|number,
 * decimals?: (number|'floor'|'ceil'|'round'),
 * mod?: number|string,
 * sub?: number|string,
 * add?: number|string,
 * multiplyBy?: number|string,
 * divideBy?: number|string,
 * power?: number|string,
 * cast?: ('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'),
 * decrypt?:{
 * secret?: string,
 * iv?: string,
 * sha?: (224|256|384|512)}
 * as?:string
 * }} numObj.val
 * 
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [numObj.encryption] (optional) inherits encryption config from its parent level
 * 
 * @param {*} [numObj.ctx]
 * 
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepNumeric = ({ alias, val, encryption, ctx }) => {

    console.group('prep numeric invoked')
    const values = []
    let sql = ''

    const { value, decimals=null, mod=null, sub=0, add=0, multiplyBy=null, divideBy=null, power=null, cast=null, decrypt=null, as=null } = val

    if (decimals === 'ceil') sql += 'CEIL('
    else if (decimals === 'floor') sql += 'FLOOR('
    else if (decimals === 'round') sql += 'ROUND('
    else if (typeof decimals === 'number') sql += 'FORMAT('

    // apply subtraction bracket
    if (sub) sql += '('

    // apply addition bracket
    if (add) sql += '('

    // apply multiplier bracket
    if (multiplyBy) sql += '('

    // apply modulus bracket
    if (mod) sql += '('

    // apply division
    if (divideBy) sql += '('

    // apply power of
    if (power) sql += 'POWER('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // patch placeholder to the sql string
    const placeholder = prepPlaceholder(value)
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

    // apply power (extras)
    if (power) {
        const powPlaceholder = prepPlaceholder(power)
        const powName = prepName({ alias, value: power })
        sql += ', ' + powPlaceholder + ')'
        if (!checkConstants(power)) values.push(powName)
    }

    // apply division (extras)
    if (divideBy) {
        const divisorPlaceholder = prepPlaceholder(divideBy)
        const divisorName = prepName({ alias, value: divideBy })
        sql += ' / ' + divisorPlaceholder + ')'
        if (!checkConstants(divideBy)) values.push(divisorName)
    }

    // apply modulus (extras)
    if (mod) {
        const modPlaceholder = prepPlaceholder(mod)
        const modName = prepName({ alias, value: mod })
        sql += ' MOD ' + modPlaceholder + ')'
        if (!checkConstants(mod)) values.push(modName)
    }

    // apply multiplier (extras)
    if (multiplyBy) {
        const multiplierPlaceholder = prepPlaceholder(multiplyBy)
        const multiplierName = prepName({ alias, value: multiplyBy })
        sql += ' * ' + multiplierPlaceholder + ')'
        if (!checkConstants(multiplyBy)) values.push(multiplierName)
    }

    // apply addition (extras)
    if (add) {
        const addPlaceholder = prepPlaceholder(add)
        const addName = prepName({ alias, value: add })
        sql += ' + ' + addPlaceholder + ')'
        if (!checkConstants(add)) values.push(addName)
    }

    // apply subtraction (extras)
    if (sub) {
        const subPlaceholder = prepPlaceholder(sub)
        const subName = prepName({ alias, value: sub })
        sql += ' - ' + subPlaceholder + ')'
        if (!checkConstants(sub)) values.push(subName)
    }

    // apply decimal format (extras)
    if (decimals) {
        if (typeof decimals === 'number') {
            sql += ', ?'
            values.push(decimals)
        }
        sql += ')'
    }

    sql += ' AS ?'
    values.push(as || (value.includes('.') ? value.split('.')[1] : value))

    console.groupEnd()
    return { sql, values }
}

module.exports = { prepNumeric }