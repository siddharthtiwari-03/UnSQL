const { colors } = require("./console.helper")

/**
 * prepares name to be injected against a placeholder during query execution / preparing statement
 * @function prepName
 * @param {object} nameBuilder
 * @param {string} nameBuilder.alias local reference for the table name
 * @param {*} nameBuilder.value actual value to prepare name for
 * @returns {string} prepared name to replace the placeholder
 */
const prepName = ({ alias, value }) => {

    if (value?.toString()?.startsWith('#')) {
        return value.substring(1)
    }

    return typeof value === 'number' || typeof value === 'boolean' || parseInt(value) || Date.parse(value) || value.toString().includes('.') ? value : (alias ? alias + '.' : '') + value
}

module.exports = { prepName }