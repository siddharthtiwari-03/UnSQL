const { colors } = require("./console.helper")
const { checkConstants, dataTypes } = require("./constants.helper")
const { prepName } = require("./name.helper")
const { prepPlaceholder } = require("./placeholder.helper")

const dateUnits = {
    mi: 'MICROSECOND',
    s: 'SECOND',
    m: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    M: 'MONTH',
    q: 'QUARTER',
    y: 'YEAR',
    smi: 'SECOND_MICROSECOND',
    mmi: 'MINUTE_MICROSECOND',
    ms: 'MINUTE_SECOND',
    hmi: 'HOUR_MICROSECOND',
    hs: 'HOUR_SECOND',
    hm: 'HOUR_MINUTE',
    dmi: 'DAY_MICROSECOND',
    ds: 'DAY_SECOND',
    dm: 'DAY_MINUTE',
    dh: 'DAY_HOUR',
    yM: 'YEAR_MONTH',
}


/**
 * @typedef {object} encryption
 * 
 * @prop {string} [mode] (optional) ('aes-128-ecb'|'aes-256-cbc'),
 * @prop {string} [secret] (optional) string,
 * @prop {string} [iv] (optional) string,
 * @prop {string} [sha] (optional) (224|256|384|512)
 */

/**
 * @typedef {object} dateVal
 * 
 * @prop  {string|string[]} value name of the column or date as a string
 * @prop {number} [add] (optional) date / time to be added to the 'value' property
 * @prop {number} [sub] (optional) date / time to be subtracted from the 'value' property
 * @prop {string} [fromPattern] (optional) pattern to recognize and generate date from
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [cast] (optional) cast the decrypted 'value' property into
 * @prop {encryption} [decrypt] (optional) decryption configuration for the 'value' property
 */


/**
 * performs various date operation(s) on the value attribute
 * @function prepDate
 * @param {object} dateObj
 * @param {string} [dateObj.alias] (optional) local reference for the table name
 * @param {{
 * value:(string|string[]), 
 * add?:number, 
 * sub?:number, 
 * fromPattern?:string, 
 * cast?:('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'), 
 * decrypt?:{
 * secret?:string, 
 * iv?:string, 
 * sha?:(224|256|384|512)}, 
 * format?:string, 
 * as?:string 
 * }} dateObj.val object that holds values for different properties
 * @param {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [dateObj.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [dateObj.ctx] (optional) inherits class context reference from its parent level
 * @returns {{sql:string, values:Array}} 'sql' with placeholder string and 'values' array to be injected at execution
 */
const prepDate = ({ alias, val, encryption = undefined, ctx = undefined }) => {

    // deconstruct different props from the val object
    const { value, add = 0, sub = 0, format = null, fromPattern = null, cast = null, decrypt = null, as = null } = val

    const addInterval = (add && parseFloat(add)) || null
    const subInterval = (sub && parseFloat(sub)) || null
    const addUnit = (add && typeof add === 'string' && add?.match(/[a-z]+/ig)) || null
    const subUnit = (sub && typeof sub === 'string' && sub?.match(/[a-z]+/ig)) || null

    // init local sql string and values array
    let sql = ''
    const values = []

    // format date
    if (format) sql += 'DATE_FORMAT('

    // subtract date / time
    if (subInterval) sql += 'SUBDATE('

    // add date / time
    if (addInterval) sql += 'ADDDATE('

    // create date from string pattern
    if (fromPattern) sql += 'STR_TO_DATE('

    // apply type casting
    if (cast || decrypt) sql += 'CAST('

    // patch decryption method if required
    if (decrypt) sql += 'AES_DECRYPT('

    // extract placeholder
    const placeholder = prepPlaceholder(value)

    // patch placeholder to the sql string
    sql += placeholder
    // patch value to values array (conditional)
    if (!checkConstants(value)) {
        // prepare name
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

    // patch string to date pattern
    if (fromPattern) {
        sql += ', ?)'
        values.push(fromPattern)
    }

    // patching if addInterval is provided
    if (addInterval) {

        if (!addUnit) {
            sql += ', ?)'
        }
        else if (!dateUnits[addUnit]) {
            console.error(colors.red, 'Invalid date / time unit provided', colors.reset)
            throw new Error('Invalid date / time unit provided!', { cause: 'Unit value provided is invalid!' })
        }
        else {
            sql += ', INTERVAL ? ' + dateUnits[addUnit] + ')'
        }

        values.push(addInterval)

    }

    // patching if subInterval is provided
    if (subInterval) {

        if (!subUnit) sql += ', ?)'

        else if (!dateUnits[subUnit]) {
            console.error(colors.red, 'Invalid date / time unit provided', colors.reset)
            throw new Error('Invalid date / time unit provided!', { cause: 'Unit value provided is invalid!' })
        }

        else sql += ', INTERVAL ? ' + dateUnits[subUnit] + ')'

        values.push(subInterval)

    }

    if (format) {
        sql += ', ?)'
        values.push(format)
    }

    // if (as) {
    sql += ' AS ?'
    values.push(as || (value.includes('.') ? value.split('.')[1] : value))
    // }

    // return result object
    return { sql, values }
}

module.exports = { prepDate }