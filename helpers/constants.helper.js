const checkConstants = value => value.toString().includes('*') || 'pi' === value || 'now' === value || 'currentDate' === value || 'currentTime' === value || 'currentTimestamp' === value || 'localTime' === value || 'localTimestamp' === value

const constantFunctions = {
    now: 'NOW',
    currentDate: 'CURDATE',
    currentTime: 'CURRENT_TIME',
    currentTimestamp: 'CURRENT_TIMESTAMP',
    localTime: 'LOCALTIME',
    localTimestamp: 'LOCALTIMESTAMP',
    pi: 'PI'
}

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

const aggregateFunctions = {
    sum: 'SUM',
    avg: 'AVG',
    count: 'COUNT',
    max: 'MAX',
    min: 'MIN',
}

module.exports = { checkConstants, dataTypes, constantFunctions, aggregateFunctions }