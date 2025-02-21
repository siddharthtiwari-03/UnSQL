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
 * @returns {string} prepared name to replace the placeholder
 */
const prepName = ({ alias, value }) => {
    if (value?.toString()?.startsWith('#')) return value.substring(1)
    return typeof value === 'number' || typeof value === 'boolean' || parseInt(value) || Date.parse(value) || value.toString().includes('.') ? sanitizeSql(value) : sanitizeSql((alias ? alias + '.' : '') + value)
}

module.exports = { prepName }