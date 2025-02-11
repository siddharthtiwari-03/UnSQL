const { checkConstants, constantFunctions } = require("./constants.helper")

/**
 * prepares placeholder depending upon the 'value' parameter
 * @function prepPlaceholder
 * 
 * @param {string|boolean|number|Date} value string / number / boolean / array of string to generate a placeholder for
 * 
 * @returns {('?'|'??'|string)} placeholder or a constant function name
 */
const prepPlaceholder = value => {
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
        return '?'
    }

    return '??'
}

module.exports = { prepPlaceholder }