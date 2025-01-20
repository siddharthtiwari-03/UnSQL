const { colors } = require("./console.helper")

const prepareName = ({ alias, value }) => {
    console.group(colors.gray, 'prepareName invoked', colors.reset)

    console.log('value to extract name', value)

    if (Array.isArray(value) || parseInt(value) || Date.parse(value)) {
        console.log('name value is array or date or numeric')
        console.groupEnd()
        return value
    }

    console.groupEnd()
    return typeof value === 'number' || typeof value === 'boolean' || value.includes('.') ? value : (alias ? alias + '.' : '') + value
}

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

const extractName = (value) => {
    console.log('value inside extract name', value)

    if (Array.isArray(value)) return extractName(value[0])


    // return value.includes('.') ? value.split('.')[1] : value
    return typeof value === 'string' && value?.split('.')[1] || value
}

module.exports = { prepareName, prepName, extractName }