export type AggregateKey = "sum" | "avg" | "count" | "min" | "max";
/**
 * prepares select query using various
 * @param {Object} selectParam
 * @param {string?} [selectParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").SelectObject} selectParam.select array of columns / values / wrapper methods
 * @param {Array<*>} selectParam.values (optional) local reference name of the table
 * @param {import("../defs/types").EncryptionConfig} [selectParam.encryption] (optional) query level encryption configuration
 * @param {*} [selectParam.ctx] (optional) context reference of the parent model class
 * @returns {string} 'sql' with placeholder string to be injected at execution
 */
export function prepSelect({ alias, select, values, encryption, ctx }: {
    alias?: string | null | undefined;
    select: import("../defs/types").SelectObject;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/**
 * prepares where statement
 * @param {Object} whereParam
 * @param {string?} [whereParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").WhereObject|import("../defs/types").HavingObject} [whereParam.where] (optional) allows to filter records using various conditions
 * @param {string|null} [whereParam.parent] (optional) reference of parent key
 * @param {Array<*>} whereParam.values reference of global values array
 * @param {import("../defs/types").EncryptionConfig} [whereParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [whereParam.ctx] (optional) local reference name of the table
 * @returns {string} 'sql' with placeholder string and 'values' array to be injected at execution
 */
export function prepWhere({ alias, where, parent, values, encryption, ctx }: {
    alias?: string | null | undefined;
    where?: string | number | boolean | Date | import("../defs/types").WrapperMethods | import("../defs/types").ValueOptions[] | {
        [x: string]: import("../defs/types").ValuesObject | import("../defs/types").ComparatorObjects | {
            between: import("../defs/types").BetweenObject;
        };
    } | import("../defs/types").CompositeMethods | import("../defs/types").AggregateWrappers | undefined;
    parent?: string | null | undefined;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/**
 * prepares join query statement
 * @param {Object} joinParam
 * @param {string} [joinParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").JoinObject} joinParam.join array of joining conditions
 * @param {Array<*>} joinParam.values
 * @param {import("../defs/types").EncryptionConfig} [joinParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [joinParam.ctx] context reference to parent class
 * @returns {string} 'sql' with placeholder string to be injected at execution
 */
export function prepJoin({ alias, join, values, encryption, ctx }: {
    alias?: string | undefined;
    join: import("../defs/types").JoinObject;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/**
 * prepares sort order
 * @param {Object} params
 * @param {string} [params.alias]
 * @param {Record<string, 'asc'|'desc'>|Record<string, any>} params.orderBy
 * @param {Array<*>} params.values
 * @param {*} params.ctx
 */
export function prepOrderBy({ alias, orderBy, values, ctx }: {
    alias?: string | undefined;
    orderBy: Record<string, "asc" | "desc"> | Record<string, any>;
    values: Array<any>;
    ctx: any;
}): string;
/**
 * checks if placeholder is variable or not
 * @param {*} value
 * @returns {boolean}
 */
export function isVariable(value: any): boolean;
/**
 * patches group by clause
 * @param {Object} options
 * @param {Array<*>} options.groupBy
 * @param {string} [options.alias]
 * @param {Array<*>} options.values
 * @param {*} [options.ctx]
 * @returns {string}
 */
export function patchGroupBy({ groupBy, alias, values, ctx }: {
    groupBy: Array<any>;
    alias?: string | undefined;
    values: Array<any>;
    ctx?: any;
}): string;
/**
 * patch limit/offset
 * @param {number} limit
 * @param {Array<*>} values
 * @param {*} ctx
 * @param {'LIMIT'|'OFFSET'} [key=LIMIT]
 * @returns {string}
 */
export function patchLimit(limit: number, values: Array<any>, ctx: any, key?: "LIMIT" | "OFFSET"): string;
/** @param {*} params */
export function prepEncryption({ placeholder, col, encrypt, values, encryption, ctx }: any): any;
/**
 * prepares sub query
 * @param {Object} referParam object with different properties that help generate aggregate method
 * @param {import("../defs/types").BaseQuery} referParam.val accepts values related to aggregate method
 * @param {*} [referParam.parent] accepts values related to aggregate method
 * @param {Array<*>} referParam.values reference of previous placeholder
 * @param {import("../defs/types").EncryptionConfig} [referParam.encryption] (optional) inherits encryption config from its parent level
 * @param {*} [referParam.ctx] context reference to parent class
 * @returns {string} 'sql' with placeholder string to be injected at execution
 */
export function prepRefer({ val, parent, values, encryption, ctx }: {
    val: import("../defs/types").BaseQuery;
    parent?: any;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/** @param {*} obj  */
export function hasKeys(obj: any): boolean;
