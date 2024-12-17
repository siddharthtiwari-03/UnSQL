const checkConstants = value => 'pi' === value || 'currentDate' === value || 'currentTime' === value || 'currentTimestamp' === value || 'localTime' === value || 'localTimestamp' === value

const checkIntOrDate = value => parseInt(value) || Date.parse(value)

const conditions = {
    eq: ' = ',
    gt: ' > ',
    lt: ' < ',
    gtEq: ' >= ',
    ltEq: ' <= ',
    notEq: ' != ',
    isNull: ' IS NULL',
    like: ' LIKE ',
    startLike: ' LIKE ',
    endLike: ' LIKE ',
    notStartLike: ' NOT LIKE ',
    notEndLike: ' NOT LIKE ',
    notLike: ' NOT LIKE ',
    in: ' IN ',
    notIn: ' NOT IN '
}

const junctions = {
    and: ' AND ',
    or: ' OR ',
}

const orderDirections = {
    asc: 'ASC',
    desc: 'DESC'
}

const joinTypes = {
    left: 'LEFT',
    right: 'RIGHT',
    inner: 'INNER',
    outer: 'OUTER',
    cross: 'CROSS'
}


const dateFunctions = {

    currentDate: 'CURDATE',
    currentTime: 'CURRENT_TIME',
    currentTimestamp: 'CURRENT_TIMESTAMP',
    localTime: 'LOCALTIME',
    localTimestamp: 'LOCALTIMESTAMP',

    date: 'DATE',
    time: 'TIME',

    strToDate: 'STR_TO_DATE',
    dateFormat: 'DATE_FORMAT',
    timeFormat: 'TIME_FORMAT',

    addDate: 'ADDDATE',
    subDate: 'SUBDATE',
    dateDiff: 'DATEDIFF',
    timeDiff: 'TIMEDIFF',

    microSec: 'MICROSECOND',
    secToTime: 'SEC_TO_TIME',
    timeToSec: 'TIME_TO_SEC',
    second: 'SECOND',
    minute: 'MINUTE',
    hour: 'HOUR',
    day: 'DAY',
    lastDay: 'LAST_DAY',

    dayName: 'DAYNAME',
    dayOfWeek: 'DAYOFWEEK',
    dayOfMonth: 'DAYOFMONTH',
    dayOfYear: 'DAYOFYEAR',
    week: 'WEEK',
    weekDay: 'WEEKDAY',
    weekOfYear: 'WEEKOFYEAR',
    month: 'MONTH',
    monthName: 'MONTHNAME',
    quarter: 'QUARTER',
    yearWeek: 'YEARWEEK',
    year: 'YEAR',

    microSec: 'MICROSECOND',
    secToTime: 'SEC_TO_TIME',
    timeToSec: 'TIME_TO_SEC',
    second: 'SECOND',
    minute: 'MINUTE',
    hour: 'HOUR',
    day: 'DAY',
    lastDay: 'LAST_DAY',

    lag: 'LAG',
    lead: 'LEAD',

    // least: 'LEAST'

}

const dateUnits = {
    mi: 'MICROSECOND',
    s: 'SECOND',
    m: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    M: 'MONTH',
    q: 'QUARTER',
    y: 'YEAR',
    smi: 'SECOND_MICROSECOND',
    mmi: 'MINUTE_MICROSECOND',
    ms: 'MINUTE_SECOND',
    hmi: 'HOUR_MICROSECOND',
    hs: 'HOUR_SECOND',
    hm: 'HOUR_MINUTE',
    dmi: 'DAY_MICROSECOND',
    ds: 'DAY_SECOND',
    dm: 'DAY_MINUTE',
    dh: 'DAY_HOUR',
    yM: 'YEAR_MONTH',
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

const stringFunctions = {
    ascii: 'ASCII', // d

    concat: 'CONCAT_WS', // d

    field: 'FIELD', //d
    fieldInSet: 'FIND_IN_SET', // d

    // format: 'FORMAT', // d

    insert: 'INSERT',
    inStr: 'INSTR',

    upper: 'UPPER', // d
    lower: 'LOWER', // d

    charLen: 'CHAR_LENGTH', // d
    len: 'LENGTH', // d
    // locate: 'LOCATE', // d

    padLeft: 'LPAD', // d
    padRight: 'RPAD', // d

    // cropLeft: 'LEFT', // d
    // cropRight: 'RIGHT', // d

    trim: 'TRIM', // d
    lTrim: 'LTRIM', // d
    rTrim: 'RTRIM', // d

    subString: 'SUBSTRING', // d
    // repeat: 'REPEAT', // d
    replace: 'REPLACE', // d
    reverse: 'REVERSE', // d
    space: 'SPACE', // d

    strCompare: 'STRCMP',
    // subStringIndex: 'SUBSTRING_INDEX',
}

const numericFunctions = {
    abs: 'ABS',
    avg: 'AVG',
    ceil: 'CEIL', // d
    floor: 'FLOOR', // d
    round: 'ROUND', // d
    truncate: 'TRUNCATE',
    max: 'MAX',
    min: 'MIN',
    sign: 'SIGN',
    sqrt: 'SQRT', // d

    deg: 'DEGREES',
    rad: 'RADIANS',
    pi: 'PI', // d

    sin: 'SIN',
    cos: 'COS',
    tan: 'TAN',
    cot: 'COT',
    acos: 'ACOS',
    asin: 'ASIN',
    atan: 'ATAN',
    atan2: 'ATAN2',
    log: 'LOG',

    exp: 'EXP', // d
    div: 'DIV', // d
    count: 'COUNT',
    sum: 'SUM',

    random: 'RAND',
    pow: 'POW', // d
    mod: 'MOD', // d
    least: 'LEAST',
    greatest: 'GREATEST',

}

const advanceFunctions = {
    toBin: 'BIN',
    toBinary: 'BINARY',
    case: 'CASE',
}

module.exports = { checkConstants, checkIntOrDate, conditions, junctions, joinTypes, orderDirections, dateFunctions, dateUnits, dataTypes, stringFunctions, numericFunctions, advanceFunctions }