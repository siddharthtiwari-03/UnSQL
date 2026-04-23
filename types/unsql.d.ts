/**
 * JavaScript ORM for structured databases (MySQL, PostgreSQL, SQLite)
 * Extend this class to access clean, structured database interaction interface
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
export class UnSQL {
    /**
     * config is a static property object, used to declare configurations relating to a model class
     * @type {import("./defs/types").ConfigObject} (required) defines configurations for this model class
     */
    static config: import("./defs/types").ConfigObject;
    /**
     * Fetches records from the database table based on provided criteria.
     * @param {Object} [findParam={}] - Configuration for the find operation.
     * @param {string} [findParam.alias] - Local reference name for table mapped to this model.
     * @param {import("./defs/types").SelectObject} [findParam.select=[]] - Columns to extract; accepts arrays, column names, or wrapper methods.
     * @param {import("./defs/types").JoinObject} [findParam.join=[]] - Association of child table(s) to this model.
     * @param {import("./defs/types").WhereObject} [findParam.where={}] - Filter conditions for the query.
     * @param {string[]} [findParam.groupBy=[]] - Column(s) to group records by.
     * @param {import("./defs/types").HavingObject} [findParam.having={}] - Filter using aggregate methods.
     * @param {Object<string, 'asc'|'desc'>} [findParam.orderBy={}] - Sort order for the results.
     * @param {number} [findParam.limit] - Maximum number of records to fetch.
     * @param {number} [findParam.offset] - Starting index for pagination.
     * @param {Boolean} [findParam.includeMeta=false] - Whether to include metadata in the response.
     * @param {import("./defs/types").EncryptionConfig} [findParam.encryption={}] - Query-level encryption settings.
     * @param {import("./defs/types").DebugTypes} [findParam.debug=false] - Debug mode configuration.
     * @param {SessionManager} [findParam.session] - Database session/transaction manager.
     * @returns {Promise<{success: boolean, error?: any, result?: any[]|any, meta?: any}>}
     * Resolves with the execution status and the resulting dataset or error.
     * @example
     * const { success, result } = await User.find({
     * where: { status: true, role: '#admin' },
     * limit: 10,
     * debug: 'query',
     * });
     */
    static find({ alias, select, join, where, groupBy, having, orderBy, limit, offset, encryption, debug, session, includeMeta }?: {
        alias?: string | undefined;
        select?: import("./defs/types").SelectObject | undefined;
        join?: import("./defs/types").JoinObject | undefined;
        where?: import("./defs/types").WhereObject | undefined;
        groupBy?: string[] | undefined;
        having?: import("./defs/types").HavingObject | undefined;
        orderBy?: {
            [x: string]: "asc" | "desc";
        } | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
        includeMeta?: boolean | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        session?: SessionManager | undefined;
    }): Promise<{
        success: boolean;
        error?: any;
        result?: any[] | any;
        meta?: any;
    }>;
    /**
     * Insert update or upsert data into database
     * @param {Object} saveParam
     * @param {string?} [saveParam.alias]
     * @param {Record<string, any>|any[]} saveParam.data
     * @param {import("./defs/types").WhereObject} saveParam.where
     * @param {any[]} [saveParam.upsert]
     * @param {string[]} [saveParam.indexes]
     * @param {any} [saveParam.encrypt]
     * @param {import("./defs/types").DebugTypes} [saveParam.debug]
     * @param {import("./defs/types").EncryptionConfig} [saveParam.encryption]
     * @param {SessionManager} [saveParam.session]
     * @returns {Promise<{success:boolean, error?:*, result?:Array<*>|{insertId?:number, changes?:number}|{fieldCount?: number, affectedRows?: number, insertId?: number, info?: string, serverStatus?: number, warningStatus?: number, changedRows?: number }}>}
     */
    static save({ alias, data, where, upsert, indexes, encrypt, encryption, debug, session }: {
        alias?: string | null | undefined;
        data: Record<string, any> | any[];
        where: import("./defs/types").WhereObject;
        upsert?: any[] | undefined;
        indexes?: string[] | undefined;
        encrypt?: any;
        debug?: import("./defs/types").DebugTypes;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        session?: SessionManager | undefined;
    }): Promise<{
        success: boolean;
        error?: any;
        result?: Array<any> | {
            insertId?: number;
            changes?: number;
        } | {
            fieldCount?: number;
            affectedRows?: number;
            insertId?: number;
            info?: string;
            serverStatus?: number;
            warningStatus?: number;
            changedRows?: number;
        };
    }>;
    /**
     * delete method is used to remove record(s) from the database table
     * @param {Object} deleteParam delete query object definition
     * @param {string} [deleteParam.alias] (optional) local alias name for the database table
     * @param {import("./defs/types").WhereObject} [deleteParam.where] (optional) filter record(s) to be updated
     * @param {import("./defs/types").EncryptionConfig} [deleteParam.encryption] (optional) defines query level encryption configurations
     * @param {import("./defs/types").DebugTypes} [deleteParam.debug] (optional) enables various debug mode
     * @param {SessionManager} [deleteParam.session] (optional) global session reference for transactions and rollback
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static delete({ alias, where, debug, encryption, session }?: {
        alias?: string | undefined;
        where?: import("./defs/types").WhereObject | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        session?: SessionManager | undefined;
    }): Promise<{
        success: boolean;
        error?: any;
        result?: any;
    }>;
    /**
     * rawQuery method is used to execute raw SQL query on the database
     * @param {Object} rawQueryParams
     * @param {string} rawQueryParams.sql (required) SQL query to be executed
     * @param {Array<*>} [rawQueryParams.values] (optional) values to be interpolated in the query
     * @param {import("./defs/types").EncryptionConfig} [rawQueryParams.encryption] (optional) encryption configurations
     * @param {import("./defs/types").DebugTypes} [rawQueryParams.debug] (optional) enables debug mode
     * @param {boolean} [rawQueryParams.multiQuery] (optional) flag if sql contains multiple queries (only in 'mysql'), default is false
     * @param {SessionManager} [rawQueryParams.session] (optional) global session reference for transactions and rollback
     * @param {Boolean} [rawQueryParams.includeMeta=false] - Whether to include metadata in the response.
     * @param {'run'|'all'|'exec'} [rawQueryParams.methodType=all] (optional) used only with 'sqlite'
     * @returns {Promise<{success:boolean, error?:*, result?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
     */
    static rawQuery({ sql, values, debug, encryption, session, multiQuery, methodType, includeMeta }: {
        sql: string;
        values?: any[] | undefined;
        encryption?: import("./defs/types").EncryptionConfig | undefined;
        debug?: import("./defs/types").DebugTypes;
        multiQuery?: boolean | undefined;
        session?: SessionManager | undefined;
        includeMeta?: boolean | undefined;
        methodType?: "all" | "run" | "exec" | undefined;
    }): Promise<{
        success: boolean;
        error?: any;
        result?: any;
    }>;
    /**
     * export record(s) from the table
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
     * @param {{[column:string]:import("./defs/types").EncryptionConfig}} [exportParam.encrypt] (optional) column(s) to encrypt
     * @param {import("./defs/types").EncryptionConfig} [exportParam.encryption] (optional) set encryption configuration
     * @param {'append'|'override'} [exportParam.mode] (optional) set writing mode
     * @param {import("./defs/types").DebugTypes} [exportParam.debug] (optional) set debug mode
     * @returns {Promise<{success: boolean, message?: string, error?: *}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
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
     * @param {Object} resetParam
     * @param {import("./defs/types").DebugTypes} [resetParam.debug] (optional) set debug mode
     * @returns {Promise<{success:boolean, message?:string, result?:*, error?:*}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'result'
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
 * provides various lifecycle methods to manage re-usable MySQL session (transactions)
 * @returns {Promise<{success: boolean, error?: string, message?: string}>} Promise resolving with two parameters: boolean 'success' and either 'error' or 'message'
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
export class SessionManager {
    /**
     * @param {*} pool MySQL connection pool or connection object or PostgreSQL pool object
     * @param {'mysql'|'postgresql'|'sqlite'} [dialect='mysql']
     */
    constructor(pool: any, dialect?: "mysql" | "postgresql" | "sqlite");
    pool: any;
    dialect: "mysql" | "postgresql" | "sqlite";
    releaseClient: boolean;
    /**
     * initiates transaction
     * @returns {Promise<void|{success: false, error: *}|{success: true, message: string}>}
     */
    init(): Promise<void | {
        success: false;
        error: any;
    } | {
        success: true;
        message: string;
    }>;
    client: any;
    /**
     * rollbacks the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void|{success: true, message: string}|{success: false, error:*}>}
     */
    rollback(close?: boolean): Promise<void | {
        success: true;
        message: string;
    } | {
        success: false;
        error: any;
    }>;
    /**
     * commits the changes, if 'false' is passed then session will not be closed
     * @param {boolean} [close=true]
     * @returns {Promise<void|{success: true, message: string}|{success: false, error: *}>}
     */
    commit(close?: boolean): Promise<void | {
        success: true;
        message: string;
    } | {
        success: false;
        error: any;
    }>;
    /**
     * terminates the session and releases the connection
     * @returns {Promise<void|{success: true, message: string}|{success: false, error: *}>}
     */
    close(): Promise<void | {
        success: true;
        message: string;
    } | {
        success: false;
        error: any;
    }>;
}
