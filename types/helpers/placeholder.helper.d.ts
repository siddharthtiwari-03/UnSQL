/**
 * prepares placeholder depending upon the 'value' parameter
 * @function prepPlaceholder
 * @param {object} options
 * @param {string|boolean|number|Date|Record<string, any>} options.value string / number / boolean / array of string to generate a placeholder for
 * @param {string|null} [options.alias] alias for the value
 * @param {any} [options.ctx] string / number / boolean / array of string to generate a placeholder for
 *
 * @returns {'?'|'??'|string|number|boolean|null} placeholder or a constant function name
 */
export function prepPlaceholder({ value, alias, ctx }: {
    value: string | boolean | number | Date | Record<string, any>;
    alias?: string | null | undefined;
    ctx?: any;
}): "?" | "??" | string | number | boolean | null;
