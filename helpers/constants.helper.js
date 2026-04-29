/**
 * 
 * @param {*} value 
 * @returns 
 */
const checkConstants = value => (value != null && value.toString().includes('*')) || value in SQL_CONSTANTS

/** @type {Record<string, string>} */
const SQL_CONSTANTS = {
    now: 'NOW()',
    currentDate: 'CURRENT_DATE',
    currentTime: 'CURRENT_TIME',
    currentTimestamp: 'CURRENT_TIMESTAMP',
    utcTimestamp: 'UTC_TIMESTAMP',
    localTime: 'LOCALTIME',
    localTimestamp: 'LOCALTIMESTAMP',
    pi: 'PI()',
    null: 'IS NULL',
    isNull: 'IS NULL',
    notNull: 'IS NOT NULL',
    isNotNull: 'IS NOT NULL',
    jsonArray: 'JSON_ARRAY()',
    jsonObject: 'JSON_OBJECT()',
}

/** @type {Record<string, string>} */
const dataTypes = {
    date: 'DATE',
    dateTime: 'DATETIME',
    time: 'TIME',
    decimal: 'DECIMAL',
    char: 'CHAR',
    nchar: 'NCHAR',
    signed: 'SIGNED',
    unsigned: 'UNSIGNED',
    binary: 'BINARY',
}

/** @type {Record<string, string>} */
const AGGREGATE_WINDOW_MAP = {
    sum: 'SUM',
    avg: 'AVG',
    count: 'COUNT',
    max: 'MAX',
    min: 'MIN',
}

/**
 * @type {Record<string, string>}
 */
const OFFSET_WINDOW_MAP = {
    lead: 'LEAD',
    lag: 'LAG'
}

/** @type {Record<string, string>} */
const FRAME_BOUND_KEYWORDS = {
    unboundedPreceding: 'UNBOUNDED PRECEDING',
    currentRow: 'CURRENT ROW',
    unboundedFollowing: 'UNBOUNDED FOLLOWING'
}

/** @type {Record<string, string>} */
const FRAME_UNITS = {
    rows: 'ROWS',
    range: 'RANGE',
    groups: 'GROUPS'
}

/** @type {Record<string, string>} */
const RANK_WINDOW_MAP = {
    rank: 'RANK',
    denseRank: 'DENSE_RANK',
    percentRank: 'PERCENT_RANK',
    rowNum: 'ROW_NUMBER',
    nTile: 'NTILE',
}

const VALUE_WINDOW_MAP = {
    firstValue: 'FIRST_VALUE',
    lastValue: 'LAST_VALUE',
    nthValue: 'NTH_VALUE',
}

module.exports = { checkConstants, dataTypes, SQL_CONSTANTS, AGGREGATE_WINDOW_MAP, FRAME_UNITS, FRAME_BOUND_KEYWORDS, OFFSET_WINDOW_MAP, RANK_WINDOW_MAP, VALUE_WINDOW_MAP }