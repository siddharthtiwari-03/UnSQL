export namespace colors {
    let reset: string;
    let red: string;
    let green: string;
    let yellow: string;
    let blue: string;
    let cyan: string;
}
/**
 *
 * @param {import("../defs/types").DebugTypes} debug
 * @param {string} sql
 * @param {Array<*>} values
 * @param {string} prepared
 */
export function handleQueryDebug(debug: import("../defs/types").DebugTypes, sql: string, values: Array<any>, prepared?: string): void;
/**
 *
 * @param {import("../defs/types").DebugTypes} debug
 * @param {*} error
 */
export function handleError(debug: import("../defs/types").DebugTypes, error: any): void;
