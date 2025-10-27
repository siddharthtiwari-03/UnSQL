// const sanitizeSql = (input) => {
//     const sqlKeywords = /SELECT |INSERT |UPDATE |DELETE |DROP |UNION |;|\\'|\\\"|\-\-|\/\*|\*\/|\%|CONCAT|CHAR|SLEEP|WAITFOR DELAY/i // Basic blacklist
//     const matched = RegExp(sqlKeywords).exec(input)?.[0]
//     if (!!matched) throw new Error('SQL injection detected! while sanitizing: ' + input + ', threat type detected: ' + matched, { cause: 'SQL injection with keyword: ' + matched + ' detected' })
//     // More complex regular expressions can be added, but they are not foolproof.
//     return input; // No obvious SQL injection detected
// }

// // New function for escaping internal quotes
// const escapeIdentifier = (input) => {
//     // Escapes a double quote (") by replacing it with two double quotes ("")
//     // This is the standard for PostgreSQL/SQLite identifier escaping.
//     return input.replace(/"/g, '""');
// }

// /**
//  * prepares name to be injected against a placeholder during query execution / preparing statement
//  * @function prepName
//  * @param {object} nameBuilder
//  * @param {string} [nameBuilder.alias] local reference for the table name
//  * @param {*} nameBuilder.value actual value to prepare name for
//  * @param {*} [nameBuilder.ctx] context reference
//  * @returns {string} prepared name to replace the placeholder
//  */
// const prepName = ({ alias, value, ctx = undefined }) => {
//     if (typeof value === 'string' && value?.startsWith('#')) return value.substring(1)
//     if (typeof value == 'string' && value.trim() == '') return value
//     if (typeof value === 'number' || typeof value === 'boolean') return value
//     if (!isNaN(Date.parse(value)) || !isNaN(parseInt(value))) return value

//     // 1. Process dot-separated identifiers (table.column)
//     if (value.includes('.')) {
//         const [table, column] = value.split('.')
//         // Apply escaping to both parts
//         const safeTable = escapeIdentifier(sanitizeSql(table))
//         const safeColumn = escapeIdentifier(sanitizeSql(column))

//         return !ctx?.isMySQL
//             ? `"${safeTable}"."${safeColumn}"` // PostgreSQL/SQLite
//             : value // MySQL (handled by ??)
//     }

//     // 2. Process single identifiers
//     const prefix = alias ? `${!ctx?.isMySQL ? `"${escapeIdentifier(alias)}"` : alias}.` : ''

//     // Apply escaping to the single identifier
//     const safeValue = escapeIdentifier(sanitizeSql(value))

//     return !ctx?.isMySQL
//         ? `${prefix}"${safeValue}"` // PostgreSQL/SQLite
//         : `${prefix}\`${safeValue}\`` // MySQL (using backticks)
// }

// module.exports = { prepName }
// ** CRITICAL SECURITY FIX: Expanded Blacklist (Secondary Defense) **
// Corrected to remove extraneous spaces around pipe separators and inside hex range
const sqlKeywords = /--|;|'|"|`|SELECT\s|INSERT\s|UPDATE\s|DELETE\s|DROP\s|UNION\s|EXCEPT\s|INTERSECT\s|OR\s|AND\s|XOR\s|EXEC|CALL|XP_CMDSHELL|WAITFOR\s|BENCHMARK|SLEEP\s|FROM\s|WHERE\s|ORDER\s|GROUP\s|CAST\(|CONVERT\(|CHAR\(|\/\*|\*\/|0x[0-9A-Fa-f]+|%/ig

/**
 * Checks for known SQL injection patterns (Blacklist).
 * NOTE: This is a weak, secondary defense. The primary defense is escaping and whitelisting.
 * @param {string} input - The identifier string to sanitize.
 * @returns {string} The sanitized input.
 * @throws {Error} If a blacklisted pattern is found.
 */
const sanitizeSql = (input) => {
    // Escape and Sanitize must be called on raw value before quoting
    const matched = RegExp(sqlKeywords).exec(input)?.[0]
    if (matched) {
        throw { error: 'SQL injection detected! while sanitizing: ' + input + ', threat type detected: ' + matched }
    }
    return input;
}

/**
 * Only allows characters typically valid in SQL identifiers (letters, numbers, underscore).
 * This is the strongest security measure against identifier injection.
 * @param {string} value - The identifier string.
 * @throws {Error} If invalid characters are detected.
 */
const validateIdentifierCharacters = (value) => {
    // Strong Whitelist: Allow only A-Z, a-z, 0-9, and underscore (_).
    const isValid = /^[a-zA-Z0-9_]+$/.test(value)
    if (!isValid) {
        throw { error: `Invalid characters detected in SQL identifier: ${value}. Only alphanumeric characters and underscore are allowed.` }
    }
}

// ** NEW SECURITY FUNCTION: Identifier Escaping **
/**
 * Escapes internal double quotes (") by replacing them with two double quotes ("").
 * This is the required standard for PostgreSQL/SQLite quoted identifiers.
 * @param {string} input - The identifier string.
 * @returns {string} The escaped identifier.
 */
const escapeIdentifier = (input) => {
    // Only escape if not MySQL (MySQL uses backticks for quoting, handled by the driver implicitly via '??')
    return input.replace(/"/g, '""');
}

/**
 * prepares name to be injected against a placeholder during query execution / preparing statement
 * @function prepName
 * @param {object} nameBuilder
 * @param {string|null} [nameBuilder.alias] local reference for the table name
 * @param {*} nameBuilder.value actual value to prepare name for
 * @param {*} [nameBuilder.ctx] context reference
 * @returns {string|number|boolean} prepared name to replace the placeholder
 */
const prepName = ({ alias, value, ctx = undefined }) => {
    if (typeof value === 'string' && value?.startsWith('#')) return value.substring(1)
    if (typeof value == 'string' && value.trim() == '') return value
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (!isNaN(Date.parse(value)) || !isNaN(parseInt(value))) return value

    // ** APPLY WHITELISTING EARLY **
    if (typeof value === 'string' && !value.includes('.')) validateIdentifierCharacters(value)


    // 1. Handle dot-separated identifiers (table.column)
    if (value.includes('.')) {
        // Validation for dot-separated values (assuming both parts should be validated)
        const [table, column] = value.split('.')
        validateIdentifierCharacters(table)
        validateIdentifierCharacters(column)

        if (!ctx?.isMySQL) {
            // PostgreSQL/SQLite: Apply layered security: sanitize, then escape, then quote
            const safeTable = escapeIdentifier(sanitizeSql(table))
            const safeColumn = escapeIdentifier(sanitizeSql(column))
            return `"${safeTable}"."${safeColumn}"`
        }
        return value // MySQL handles this implicitly with '??' in the query string
    }

    // 2. Handle single identifiers (column)
    // Apply alias prefix logic
    const prefix = alias ? `${!ctx?.isMySQL ? `"${escapeIdentifier(alias)}"` : alias}.` : ''

    // Apply layered security: sanitize, then escape
    const safeValue = escapeIdentifier(sanitizeSql(value))

    return !ctx?.isMySQL
        ? `${prefix}"${safeValue}"` // PostgreSQL/SQLite: Quoted and escaped
        : `${prefix}\`${safeValue}\`` // MySQL: Uses backticks or relies on '??' elsewhere
}

module.exports = {
    sanitizeSql,
    prepName
}