/**
 * UnSQL is JavaScript based library to interact with structured databases (MySQL). It provides clean and easy interface for interaction for faster and smooth developers' experience.
 * @class
 * @alias UnSQL
 * @classdesc All model classes shall extend using UnSQL base class to access advanced functionalities
 * @namespace UnSQL
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
export class UnSQL {
    /**
     * config is a static property object, used to declare configurations relating to a model class
     * @type {import("./defs/types").ConfigObject} (required) defines configurations for this model class
     * @static
     * @public
     * @memberof UnSQL
     */
    public static config: import("./defs/types").ConfigObject;
    static _variableCount: number;
    static isMySQL: boolean;
    static isPostgreSQL: boolean;
    static isSQLite: boolean;
    /**
     * Find method
     * @method find
     * @description find method is used to fetch records from the database table
     *
     * @param {Object} findParam (optional)
     * @param {string} [findParam.alias] (optional) local reference name for table mapped to this model
     * @param {import("./defs/types").SelectObject} [findParam.select] (optional) limits columns to be extracted, accepts an array of value(s), column name(s), wrapper methods etc
     * @param {import("./defs/types").JoinObject} [findParam.join] (optional) enables association of child table(s) to this model class
     * @param {import("./defs/types").WhereObject} [findParam.where] (optional) filter record(s) based on conditions
     * @param {'and'|'or'} [findParam.junction] (optional) defines the clause ('and'|'or') used to connect conditions inside 'where' and 'having' property
     * @param {string[]} [findParam.groupBy] (optional) groups record(s) based on single (or list of) column(s)
     * @param {import("./defs/types").HavingObject} [findParam.having] (optional) similar to 'where', filters record(s) additionally allows filter using aggregate methods
     * @param {{[column:string]:('asc'|'desc')}} [findParam.orderBy] (optional) re-order extracted record(s) based on single (or list of) column(s)
     * @param {number} [findParam.limit] (optional) limits the number of record(s) to be fetched
     * @param {number} [findParam.offset] (optional) sets the starting index for records to be fetched
     * @param {import("./defs/types").EncryptionConfig} [findParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [findParam.debug] (optional) enables different debug modes
     * @param {SessionManager} [findParam.session] (optional)
     * @param {boolean} [findParam.includeMeta] (optional)
     *
     * @returns {Promise<{success:boolean, error?:*, result?:*, meta?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static find({ alias, select, join, where, junction, groupBy, having, orderBy, limit, offset, encryption, debug, session }?: {
        alias?: string | undefined;
        select?: import("./defs/types").SelectObject | undefined;
        join?: import("./defs/types").JoinObject | undefined;
        where?: import("./defs/types").WhereObject | undefined;
        junction?: "and" | "or" | undefined;
        groupBy?: string[] | undefined;
        having?: import("./defs/types").HavingObject | undefined;
        orderBy?: {
            [column: string]: "asc" | "desc";
        } | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        session?: SessionManager | undefined;
        includeMeta?: boolean | undefined;
    }, includeMeta?: boolean): Promise<{
        success: boolean;
        error?: any;
        result?: any;
        meta?: any;
    }>;
    /**
     * @method save
     * @description save method used in insert / update / upsert record(s) in the database table
     * @param {Object} saveParam (optional)
     * @param {string} [saveParam.alias] (optional) local reference name for table mapped to this model
     * @param {Object|Array<object>} saveParam.data object / array of objects to be inserted into the database table
     * @param {import("./defs/types").WhereObject} [saveParam.where] (optional) used to filter records to be updated
     * @param {'and'|'or'} [saveParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {Object} [saveParam.upsert] (optional) object data to be updated in case of 'duplicate key entry' found in the database
     * @param {{[column:string]:{secret?:string, iv?:string, sha?:import("./defs/types").EncryptionSHAs} }} [saveParam.encrypt] (optional) define encryption overrides for column(s)
     * @param {import("./defs/types").EncryptionConfig} [saveParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [saveParam.debug] (optional) enables various debug mode
     * @param {SessionManager} [saveParam.session] (optional) enables various debug mode
     *
     * @returns {Promise<{success:boolean, error?:object|*, insertId?:number, changes?:number}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static save({ alias, data, where, junction, upsert, encrypt, encryption, debug, session }: {
        alias?: string | undefined;
        data: Object | Array<object>;
        where?: import("./defs/types").WhereObject | undefined;
        junction?: "and" | "or" | undefined;
        upsert?: Object | undefined;
        encrypt?: {
            [column: string]: {
                secret?: string;
                iv?: string;
                sha?: import("./defs/types").EncryptionSHAs;
            };
        } | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        session?: SessionManager | undefined;
    }): Promise<{
        success: boolean;
        error?: object | any;
        insertId?: number;
        changes?: number;
    }>;
    /**
     * @method delete
     * @description delete method is used to remove record(s) from the database table
     *
     * @param {Object} deleteParam delete query object definition
     * @param {string} [deleteParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").WhereObject} [deleteParam.where] (optional) filter record(s) to be updated
     * @param {'and'|'or'} [deleteParam.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
     * @param {import("./defs/types").EncryptionConfig} [deleteParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [deleteParam.debug] (optional) enables various debug mode
     * @param {SessionManager} [deleteParam.session] (optional) global session reference for transactions and rollback
     *
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     *
     * @static
     * @memberof UnSQL
     */
    static delete({ alias, where, junction, debug, encryption, session }?: {
        alias?: string | undefined;
        where?: import("./defs/types").WhereObject | undefined;
        junction?: "and" | "or" | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        session?: SessionManager | undefined;
    }): Promise<{
        success: boolean;
        error?: any;
        result?: any;
    }>;
    /**
     * @method rawQuery
     * @description rawQuery method is used to execute raw SQL query on the database
     * @param {Object} rawQueryParams
     * @param {string} rawQueryParams.sql (required) SQL query to be executed
     * @param {Array<*>} rawQueryParams.values (optional) values to be interpolated in the query
     * @param {import("./defs/types").EncryptionConfig} [rawQueryParams.encryption] (optional) enables debug mode
     * @param {import("./defs/types").DebugTypes} [rawQueryParams.debug] (optional) enables debug mode
     * @param {boolean} [rawQueryParams.multiQuery] (optional) flag if sql contains multiple queries (only in 'mysql'), default is false
     * @param {*} [rawQueryParams.session] (optional) global session reference for transactions and rollback
     * @param {'run'|'all'|'exec'} [rawQueryParams.methodType=all] (optional) used only with 'sqlite'
     * @returns {Promise<{success:boolean, error?:object, result?:object}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static rawQuery({ sql, values, debug, encryption, session, multiQuery, methodType }: {
        sql: string;
        values: Array<any>;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        multiQuery?: boolean | undefined;
        session?: any;
        methodType?: "all" | "run" | "exec" | undefined;
    }): Promise<{
        success: boolean;
        error?: object;
        result?: object;
    }>;
    /**
     * export record(s) from the table
     * @method export
     * @description This method exports record(s) (filtered/un-filtered) from the database table in form of the 'Json Array' into a json file
     * @param {Object} exportParam
     * @param {string|UnSQL|*} [exportParam.target] (optional) name of the file dynamically created '.json' file or reference to a valid UnSQL model class, defaults to the table name of exporting model class
     * @param {string} [exportParam.directory] (optional) rename default export directory
     * @param {import("./defs/types").SelectObject} [exportParam.select] (optional) limit column(s) to be extracted
     * @param {string} [exportParam.alias] (optional) local reference name to the exporting model
     * @param {import("./defs/types").JoinObject} [exportParam.join] (optional) join child table(s)
     * @param {import("./defs/types").WhereObject} [exportParam.where] (optional) filter record(s) using condition(s)
     * @param {string[]} [exportParam.groupBy] (optional) group record(s) based on column(s)
     * @param {import("./defs/types").HavingObject} [exportParam.having] (optional) filter record(s) using condition(s)/aggregate wrappers
     * @param {{[key:string]:'asc'|'desc'}} [exportParam.orderBy] (optional)
     * @param {number} [exportParam.limit] (optional) limit record(s) to be extracted
     * @param {number} [exportParam.offset] (optional) set starting index
     * @param {{[column:string]:import("./defs/types").EncryptionConfig}} [exportParam.encrypt] (optional) set starting index
     * @param {import("./defs/types").EncryptionConfig} [exportParam.encryption] (optional) set encryption configuration
     * @param {'append'|'override'} [exportParam.mode] (optional) set writing mode
     * @param {import("./defs/types").DebugTypes} [exportParam.debug] (optional) set debug mode
     * @returns {Promise<{success: boolean, message?: string, error?: *}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static export({ target, directory, select, alias, join, where, groupBy, having, orderBy, limit, offset, encrypt, encryption, mode, debug }?: {
        target?: string | UnSQL | any;
        directory?: string | undefined;
        select?: import("./defs/types").SelectObject | undefined;
        alias?: string | undefined;
        join?: import("./defs/types").JoinObject | undefined;
        where?: import("./defs/types").WhereObject | undefined;
        groupBy?: string[] | undefined;
        having?: import("./defs/types").HavingObject | undefined;
        orderBy?: {
            [key: string]: "asc" | "desc";
        } | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        encrypt?: {
            [column: string]: import("./defs/types").EncryptionConfig;
        } | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        mode?: "append" | "override" | undefined;
        debug?: import("./defs/types").DebugTypes;
    }): Promise<{
        success: boolean;
        message?: string;
        error?: any;
    }>;
    /**
     * Will reset the database table to initial state
     * @method reset
     * @param {Object} resetParam
     * @param {import("./defs/types").DebugTypes} [resetParam.debug] (optional) set debug mode
     * @returns {Promise<{success:boolean, message?:string, result?:*, error?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     * @static
     * @memberof UnSQL
     */
    static reset({ debug }?: {
        debug?: import("./defs/types").DebugTypes;
    }): Promise<{
        success: boolean;
        message?: string;
        result?: any;
        error?: any;
    }>;
}
/**
 * @class
 * @description provides various lifecycle methods to manage re-usable MySQL session (transactions)
 * @alias SessionManager
 *
 * @returns {Promise<{success: boolean, error?: string, message?: string}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'message'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
export class SessionManager {
    /**
     * @constructor
     * @param {*} pool MySQL connection pool or connection object or PostgreSQL pool object
     * @param {'mysql'|'postgresql'|'sqlite'} [dialect='mysql']
     */
    constructor(pool: any, dialect?: "mysql" | "postgresql" | "sqlite");
    pool: any;
    dialect: "mysql" | "postgresql" | "sqlite";
    /**
     * @async
     * @method init
     * @description initiates transaction
     * @returns {Promise<void|{success: false, error?: *}|{success: true, message: string}>}
     * @memberof SessionManager
     */
    init(): Promise<void | {
        success: false;
        error?: any;
    } | {
        success: true;
        message: string;
    }>;
    connection: any;
    /**
     * @async
     * @method rollback
     * @description rollbacks the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void>}
     * @memberof SessionManager
     */
    rollback(close?: boolean): Promise<void>;
    /**
     * @async
     * @method commit
     * @description commits the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void|{success: false, error: string}>}
     * @memberof SessionManager
    */
    commit(close?: boolean): Promise<void | {
        success: false;
        error: string;
    }>;
    /**
     * @async
     * @method close
     * @description terminates the session and releases the connection
     * @returns {Promise<void>}
     * @memberof SessionManager
     */
    close(): Promise<void>;
}
