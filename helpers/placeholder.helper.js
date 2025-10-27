const { checkConstants, constantFunctions } = require("./constants.helper")
const { prepName } = require("./name.helper")

/**
 * prepares placeholder depending upon the 'value' parameter
 * @function prepPlaceholder
 * @param {object} options
 * @param {string|boolean|number|Date|Record<string, any>} options.value string / number / boolean / array of string to generate a placeholder for
 * @param {string|null} [options.alias] alias for the value
 * @param {any} [options.ctx] string / number / boolean / array of string to generate a placeholder for
 * 
 * @returns {'?'|'??'|string|number|boolean|null} placeholder or a constant function name
 */
const prepPlaceholder = ({ value, alias = null, ctx = undefined }) => {
    if (typeof value === 'string' && value.includes('*')) {
        if (value.includes('.')) return !ctx?.isMySQL ? `"${value.split('.')[0]}".${value.split('.')[1]}` : `\`${value.split('.')[0]}\`.${value.split('.')[1]}`
        return value
    }
    if (checkConstants(value)) {
        if (ctx?.isSQLite) {
            if (value === 'now') return `DATETIME('now')`
            else if (value === 'localTime') return `TIME('now', 'localtime')`
            else if (value === 'localTimestamp') return `DATETIME('now', 'localtime')`
        }
        return constantFunctions[String(value)]
    }
    if (value === null || value === 'null' || value === 'NULL') return null
    if (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && (value?.startsWith('#') || Date.parse(value) || parseInt(value) || parseFloat(value))) || value === ' ' || value === '') return ctx?.isPostgreSQL ? `$${ctx._variableCount++}` : '?'
    return ctx.isMySQL ? '??' : prepName({ value, alias, ctx })
}

module.exports = { prepPlaceholder }