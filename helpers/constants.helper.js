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
    avg: 'AVG',
    bitAnd: 'BIT_AND',
    bitOr: 'BIT_OR',
    bitXor: 'BIT_XOR',
    count: 'COUNT',
    max: 'MAX',
    min: 'MIN',
    std: 'STD',
    stdDev: 'STDDEV',
    stdDevPop: 'STDDEV_POP',
    stdDevSamp: 'STDDEV_SAMP',
    sum: 'SUM',
    varPop: 'VAR_POP',
    varSamp: 'VAR_SAMP',
    variance: 'VARIANCE',
}

module.exports = { checkConstants, dataTypes, constantFunctions, aggregateFunctions }