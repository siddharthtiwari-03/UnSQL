const checkConstants = value => (value != null && value.toString().includes('*')) || 'pi' === value || 'now' === value || 'currentDate' === value || 'currentTime' === value || 'currentTimestamp' === value || 'localTime' === value || 'localTimestamp' === value || 'utcTimestamp' === value || 'isNull' === value || 'isNotNull' === value || 'null' === value || 'NULL' === value || null === value

const constantFunctions = Object.freeze({
    now: 'NOW()',
    currentDate: 'CURRENT_DATE',
    currentTime: 'CURRENT_TIME',
    currentTimestamp: 'CURRENT_TIMESTAMP',
    utcTimestamp: 'UTC_TIMESTAMP',
    localTime: 'LOCALTIME',
    localTimestamp: 'LOCALTIMESTAMP',
    pi: 'PI()',
    isNull: 'IS NULL',
    isNotNull: 'IS NOT NULL'
})

const dataTypes = Object.freeze({
    date: 'DATE',
    dateTime: 'DATETIME',
    time: 'TIME',
    decimal: 'DECIMAL',
    char: 'CHAR',
    nchar: 'NCHAR',
    signed: 'SIGNED',
    unsigned: 'UNSIGNED',
    binary: 'BINARY',
})

const aggregateFunctions = Object.freeze({
    sum: 'SUM',
    avg: 'AVG',
    count: 'COUNT',
    max: 'MAX',
    min: 'MIN',
})

module.exports = { checkConstants, dataTypes, constantFunctions, aggregateFunctions }