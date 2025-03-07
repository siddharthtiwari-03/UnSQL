const { checkConstants, constantFunctions } = require("./constants.helper")
const { prepName } = require("./name.helper")

/**
 * prepares placeholder depending upon the 'value' parameter
 * @function prepPlaceholder
 * @param {object} options
 * @param {string|boolean|number|Date} options.value string / number / boolean / array of string to generate a placeholder for
 * @param {string} [options.alias] alias for the value
 * @param {object} [options.ctx] string / number / boolean / array of string to generate a placeholder for
 * 
 * @returns {('?'|'??'|string)} placeholder or a constant function name
 */
const prepPlaceholder = ({ value, alias = null, ctx = undefined }) => {
    if (value.toString().includes('*')) {
        return value
    }
    else if (checkConstants(value)) {
        if (ctx?.isSQLite) {
            if (value === 'now') return `DATETIME('now')`
            else if (value === 'localTime') return `TIME('now', 'localtime')`
            else if (value === 'localTimestamp') return `DATETIME('now', 'localtime')`
        }
        return constantFunctions[value]
    }
    else if (value === null || value === 'null' || value === 'NULL') {
        return NULL
    }
    else if (Date.parse(value) || parseInt(value) || parseFloat(value) || typeof value === 'boolean' || value?.toString()?.startsWith('#') || value === ' ' || value === '') {
        return ctx?.isPostgreSQL ? `$${ctx._variableCount++}` : '?'
    }

    return ctx.isMySQL ? '??' : prepName({ value, alias })
}

module.exports = { prepPlaceholder }