/**
 * prepares select query using various
 * @function prepSelect
 * @param {Object} selectParam
 * @param {string} [selectParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").SelectObject} selectParam.select array of columns / values / wrapper methods
 * @param {Array<*>} selectParam.values (optional) local reference name of the table
 * @param {import("../defs/types").EncryptionConfig} [selectParam.encryption] (optional) query level encryption configuration
 * @param {*} [selectParam.ctx] (optional) context reference of the parent model class
 * @returns {string} 'sql' with placeholder string to be injected at execution
 */
export function prepSelect({ alias, select, values, encryption, ctx }: {
    alias?: string | undefined;
    select: import("../defs/types").SelectObject;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/**
 * prepares where statement
 * @function prepWhere
 * @param {Object} whereParam
 * @param {string} [whereParam.alias] (optional) local reference name of the table
 * @param {import("../defs/types").WhereObject|import("../defs/types").HavingObject} [whereParam.where] (optional) allows to filter records using various conditions
 * @param {string|null} [whereParam.parent] (optional) reference of parent key
 * @param {'and'|'or'} [whereParam.junction] (optional) clause used to connect multiple where conditions
 * @param {Array<*>} whereParam.values reference of global values array
 * @param {import("../defs/types").EncryptionConfig} [whereParam.encryption] (optional) defines query level encryption configurations
 * @param {*} [whereParam.ctx] (optional) local reference name of the table
 * @returns {string} 'sql' with placeholder string and 'values' array to be injected at execution
 */
export function prepWhere({ alias, where, parent, junction, values, encryption, ctx }: {
    alias?: string | undefined;
    where?: string | number | boolean | Date | import("../defs/types").WrapperMethods | import("../defs/types").ValueOptions[] | import("../defs/types").CustomWrapper | import("../defs/types").CompositeMethods | import("../defs/types").AggregateWrappers | undefined;
    parent?: string | null | undefined;
    junction?: "and" | "or" | undefined;
    values: Array<any>;
    encryption?: import("../defs/types").EncryptionConfig | undefined;
    ctx?: any;
}): string;
/**
 * prepares join query statement
 * @function prepJoin
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
 * patches order by clause
 * @function prepOrderBy
 * @param {Object} options
 * @param {{[column:string]:'asc'|'desc'}} options.orderBy
 * @param {string} [options.alias]
 * @param {Array<*>} [options.values]
 * @param {*} [options.ctx]
 * @returns {string}
 */
export function prepOrderBy({ alias, orderBy, values, ctx }: {
    orderBy: {
        [column: string]: "asc" | "desc";
    };
    alias?: string | undefined;
    values?: any[] | undefined;
    ctx?: any;
}): string;
/**
 * checks if placeholder is variable or not
 * @function isVariable
 * @param {*} value
 * @returns {boolean}
 */
export function isVariable(value: any): boolean;
/**
 * patches group by clause
 * @function patchGroupBy
 * @param {Object} options
 * @param {Array<*>} options.groupBy
 * @param {string} [options.alias]
 * @param {Array<*>} [options.values]
 * @param {*} [options.ctx]
 * @returns {string}
 */
export function patchGroupBy({ groupBy, alias, values, ctx }: {
    groupBy: Array<any>;
    alias?: string | undefined;
    values?: any[] | undefined;
    ctx?: any;
}): string;
/**
 * patch limit/offset
 * @function patchLimit
 * @param {number} limit
 * @param {Array<*>} values
 * @param {*} ctx
 * @param {'LIMIT'|'OFFSET'} [key=LIMIT]
 * @returns {string}
 */
export function patchLimit(limit: number, values: Array<any>, ctx: any, key?: "LIMIT" | "OFFSET"): string;
/** @param {*} params */
export function prepEncryption({ placeholder, col, encrypt, values, encryption, ctx }: any): any;
