const { checkConstants, checkIntOrDate, dateFunctions, numericFunctions } = require("./constants.helper")

const preparePlaceholder = value => {
    console.group('placeholder invoked')
    console.log('value to replace', value)

    if (checkConstants(value)) {
        console.groupEnd()
        return (dateFunctions[value] || numericFunctions[value]) + '()'
    }
    else if (checkIntOrDate(value) || Array.isArray(value) || parseInt(value) || parseFloat(value)) {
        console.groupEnd()
        return '?'
    }


    console.groupEnd()

    return '??'
}

module.exports = { preparePlaceholder }