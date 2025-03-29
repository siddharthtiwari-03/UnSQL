const sanitizeSql = (input) => {
    const sqlKeywords = /SELECT |INSERT |UPDATE |DELETE |DROP |UNION |;|\'|\"/i // Basic blacklist
    const matched = RegExp(sqlKeywords).exec(input)?.[0]
    if (!!matched) throw new Error('SQL injection detected! while sanitizing: ' + input + ', threat type detected: ' + matched, { cause: 'SQL injection with keyword: ' + matched + ' detected' })
    // More complex regular expressions can be added, but they are not foolproof.
    return input; // No obvious SQL injection detected
}

/**
 * prepares name to be injected against a placeholder during query execution / preparing statement
 * @function prepName
 * @param {object} nameBuilder
 * @param {string} [nameBuilder.alias] local reference for the table name
 * @param {*} nameBuilder.value actual value to prepare name for
 * @param {*} [nameBuilder.ctx] context reference
 * @returns {string} prepared name to replace the placeholder
 */
const prepName = ({ alias, value, ctx = undefined }) => {
    if (typeof value === 'string' && value?.startsWith('#')) return value.substring(1)
    if (typeof value == 'string' && value.trim() == '') return value
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (!isNaN(Date.parse(value)) || !isNaN(parseInt(value))) return value
    if (value.includes('.')) return !ctx?.isMySQL ? `"${value.split('.')[0]}"."${value.split('.')[1]}"` : value
    const prefix = alias ? `${!ctx?.isMySQL ? `"${alias}"` : alias}.` : ''
    return !ctx?.isMySQL ? `${prefix}"${sanitizeSql(`${value}`)}"` : sanitizeSql(`${prefix}${value}`)
}

module.exports = { prepName }