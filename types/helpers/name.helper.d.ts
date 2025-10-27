/**
 * Checks for known SQL injection patterns (Blacklist).
 * NOTE: This is a weak, secondary defense. The primary defense is escaping and whitelisting.
 * @param {string} input - The identifier string to sanitize.
 * @returns {string} The sanitized input.
 * @throws {Error} If a blacklisted pattern is found.
 */
export function sanitizeSql(input: string): string;
/**
 * prepares name to be injected against a placeholder during query execution / preparing statement
 * @function prepName
 * @param {object} nameBuilder
 * @param {string|null} [nameBuilder.alias] local reference for the table name
 * @param {*} nameBuilder.value actual value to prepare name for
 * @param {*} [nameBuilder.ctx] context reference
 * @returns {string|number|boolean} prepared name to replace the placeholder
 */
export function prepName({ alias, value, ctx }: {
    alias?: string | null | undefined;
    value: any;
    ctx?: any;
}): string | number | boolean;
