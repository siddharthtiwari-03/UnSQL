export = UnSQL_Legacy;
/**
 * UnSQL_Legacy base class
 * @class UnSQL_Legacy
 * @description All the model classes must extend using this base class
 *
 * @author Siddharth Tiwari <dev.unsql@gmail.com>
 */
declare class UnSQL_Legacy {
    /** @type {*} */
    static POOL: any;
    /** @type {string|null} */
    static TABLE_NAME: string | null;
    /**
     * Generates 'select' statement
     * @method find
     * @description This method is used to dynamically generate valid SQL 'select' query that is used to read / retrieve records from the database
     * @param {object} findParam
     * @param {string} [findParam.select] (optional) comma separated string value of columns, functions that needs to be selected from the database
     * @param {string|null} [findParam.alias] (optional) local reference name for the database table
     * @param {Array<{type:string, table:string, on:string}>|null} [findParam.join] (optional) array of join object(s), each object representing the association of child table to this table
     * @param {Array<Array<string|number|boolean>>|null} [findParam.where] (optional) array of array containing conditions to filter the records from the database, each condition is joined using 'and' clause
     * @param {Array<Array<string|number|boolean>>|null} [findParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * @param {'and'|'or'|'AND'|'OR'} [findParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     * @param {string|null} [findParam.groupBy] (optional) takes in comma separated string value of column(s) that will be used to group the records together
     * @param {string|null} [findParam.having] (optional) takes in comma separated string value of column(s) / aggregate method(s) with comparators to filter records
     * @param {string|null} [findParam.orderBy] (optional) takes in comma separated string value of column(s) along with key words 'ASC' or 'DESC', that will be used to reorder the records together
     * @param {'asc'|'desc'|'ASC'|'DESC'} [findParam.orderDirection] (optional) used to define the order 'ascending' or 'descending' via. keywords 'asc' and 'desc' respectively, used when only one column name is entered in 'orderBy' property
     * @param {number|null} [findParam.rowCount] (optional) limits the number of records that will be fetched from the database table
     * @param {number|null} [findParam.offset] (optional) defines the starting index for the records to be fetched from the database table
     *
     * @returns {Promise<{ success: boolean, result?: Array<*>, error?: * }>} execution success acknowledgement along with either 'result' or 'error' object
     *
     * @static
     * @memberof UnSQL_Legacy
     */
    static find({ select, alias, join, where, whereOr, junction, groupBy, having, orderBy, orderDirection, rowCount, offset }: {
        select?: string | undefined;
        alias?: string | null | undefined;
        join?: {
            type: string;
            table: string;
            on: string;
        }[] | null | undefined;
        where?: (string | number | boolean)[][] | null | undefined;
        whereOr?: (string | number | boolean)[][] | null | undefined;
        junction?: "and" | "or" | "AND" | "OR" | undefined;
        groupBy?: string | null | undefined;
        having?: string | null | undefined;
        orderBy?: string | null | undefined;
        orderDirection?: "asc" | "desc" | "ASC" | "DESC" | undefined;
        rowCount?: number | null | undefined;
        offset?: number | null | undefined;
    }): Promise<{
        success: boolean;
        result?: Array<any>;
        error?: any;
    }>;
    /**
     * Generates 'insert' and 'update' query
     * @method save
     * @description This method is used to 'insert' or 'update' data into the database table by dynamically generating valid SQL based on the parameters passed
     * @param {object} saveParam
     * @param {string|null} [saveParam.alias] (optional) local reference name for the database table
     * @param {object} saveParam.data (required) actual data that needs to be 'inserted' or 'updated' into the database table
     * @param {object|null} [saveParam.updateObj] (optional) data that needs to be 'upsert' into the database table in case of 'duplicate key' is detected
     * @param {Array<Array<string|number|boolean>>|null} [saveParam.where] (optional) array of array containing conditions to filter the record in the database that needs to be 'updated', each condition is joined using 'and' clause
     * @param {Array<Array<string|number|boolean>>|null} [saveParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * @param {'and'|'or'|'AND'|'OR'} [saveParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     *
     * @returns {Promise<{success: boolean, insertID?: number, error?: object }>} execution success acknowledgement along with either 'insertID' (inserted index) or 'error' object
     *
     * @static
     * @memberof UnSQL_Legacy
     */
    static save({ alias, data, updateObj, where, whereOr, junction }: {
        alias?: string | null | undefined;
        data: object;
        updateObj?: object | null | undefined;
        where?: (string | number | boolean)[][] | null | undefined;
        whereOr?: (string | number | boolean)[][] | null | undefined;
        junction?: "and" | "or" | "AND" | "OR" | undefined;
    }): Promise<{
        success: boolean;
        insertID?: number;
        error?: object;
    }>;
    /**
     * Generates 'delete' query
     * @method del
     * @param {object} delParam
     * @param {string|null} [delParam.alias] (optional) local reference name for the database table
     * @param {Array<Array<string|number|boolean>>|null} [delParam.where] (optional) array of array containing conditions to filter the record in the database that needs to be 'deleted', each condition is joined using 'and' clause
     * @param {Array<Array<string|number|boolean>>|null} [delParam.whereOr] (optional) same as 'where' property, only difference is the conditions are connected using 'or' clause
     * @param {'and'|'or'|'AND'|'OR'} [delParam.junction] (optional) connects 'where' and 'whereOr' together, can be either 'and' or 'or', default is 'and'
     *
     * @returns {Promise<{success: boolean, result?: *, error?: object }>}
     */
    static del({ alias, where, whereOr, junction }: {
        alias?: string | null | undefined;
        where?: (string | number | boolean)[][] | null | undefined;
        whereOr?: (string | number | boolean)[][] | null | undefined;
        junction?: "and" | "or" | "AND" | "OR" | undefined;
    }): Promise<{
        success: boolean;
        result?: any;
        error?: object;
    }>;
}
