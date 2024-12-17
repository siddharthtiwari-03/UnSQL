const patchInline = (condition, value, elseValue = '') => condition ? value : elseValue

const patchToArray = (array, condition, value, elseValue = undefined) => {
    if (condition) {
        if (Array.isArray(value)) {
            array.push(...value)
            return array
        }
        array.push(value)
        return array
    }

    if (elseValue != undefined) {
        if (Array.isArray(elseValue)) {
            array.push(...elseValue)
            return array
        }
        array.push(elseValue)
    }
    return array
}

module.exports = { patchInline, patchToArray }