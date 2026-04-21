/**
 *
 * @param {*} value
 * @returns
 */
export function checkConstants(value: any): any;
/** @type {Record<string, string>} */
export const dataTypes: Record<string, string>;
/** @type {Record<string, string>} */
export const SQL_CONSTANTS: Record<string, string>;
/** @type {Record<string, string>} */
export const AGGREGATE_WINDOW_MAP: Record<string, string>;
/** @type {Record<string, string>} */
export const FRAME_UNITS: Record<string, string>;
/** @type {Record<string, string>} */
export const FRAME_BOUND_KEYWORDS: Record<string, string>;
/**
 * @type {Record<string, string>}
 */
export const OFFSET_WINDOW_MAP: Record<string, string>;
/** @type {Record<string, string>} */
export const RANK_WINDOW_MAP: Record<string, string>;
export namespace VALUE_WINDOW_MAP {
    let firstValue: string;
    let lastValue: string;
    let nthValue: string;
}
