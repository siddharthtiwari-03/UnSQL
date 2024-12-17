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
    return typeof value === 'number' || value.includes('.') ? value : (alias ? alias + '.' : '') + value
}

const extractName = (value) => {
    console.log('value inside extract name', value)

    if (Array.isArray(value)) return extractName(value[0])


    // return value.includes('.') ? value.split('.')[1] : value
    return typeof value === 'string' && value?.split('.')[1] || value
}

module.exports = { prepareName, extractName }