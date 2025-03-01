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
        return constantFunctions[value] + '()'
    }
    else if (value === null || value === 'null' || value === 'NULL') {
        return NULL
    }
    else if (Date.parse(value) || parseInt(value) || parseFloat(value) || typeof value === 'boolean' || value?.toString()?.startsWith('#')) {
        return ctx?.config?.dialect === 'postgresql' ? `$${ctx._variableCount++}` : '?'
    }

    return ctx?.config?.dialect === 'mysql' ? '??' : prepName({ value, alias })
}

module.exports = { prepPlaceholder }