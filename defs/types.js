// Base definitions start here

/**
 * encryption modes
 * @typedef {'aes-128-ecb'|'aes-256-cbc'} EncryptionModes
 */

/**
 * encryption sha
 * @typedef {224|256|384|512} EncryptionSHAs
 */

/**
 * casting types
 * @typedef {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} CastingTypes
 */

/**
 * debug types
 * @typedef {'query'|'error'|'benchmark'|'benchmark-query'|'benchmark-error'|boolean} DebugTypes
 */

/**
 * set configuration for Encryption/Decryption
 * @typedef {Object} EncryptionConfig
 * @prop {EncryptionModes} [mode] (optional) set encryption mode
 * @prop {string} [secret] (optional) set default 'secret' to be used
 * @prop {string} [iv] (optional) set initialization vector 'iv' (used only with 'cbc' modes)
 * @prop {EncryptionSHAs} [sha] (optional) set SHA
 */

/**
 * UnSQL config
 * @typedef {Object} ConfigObject
 * @prop {string} table name of the table to be mapped with this model class
 * @prop {boolean} safeMode protects accidental execution of 'delete-all'
 * @prop {boolean} [devMode=false] prevents 'reset' of data, enables Export/Import of records
 * @prop {Object} [connection] mysql 'connection' object
 * @prop {Object} [pool] mysql connection 'pool' object
 * @prop {EncryptionConfig} [encryption] defines Encryption/Decryption config for this model
 */

/**
 * base aggregator
 * @typedef {Object} BaseAggregate
 * @prop {Object} value
 * @prop {boolean} [distinct]
 * @prop {Object} [compare]
 * @prop {CastingTypes} [cast]
 * @prop {string} [as]
 */

/**
 * between wrapper
 * @typedef {{gt:number|string, lt:number|string}} BetweenObject
 */

/**
 * between wrapper
 * @typedef {Object} BetweenWrapper
 * @prop {{gt:number|string, lt:number|string}} between
 */

// Base definitions end here

// Composite definitions start here

/**
 * string object
 * @typedef {Object} stringObject
 * @prop {string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {boolean} [reverse]
 * @prop {'upper'|'lower'} [textCase]
 * @prop {{left?:{length:number, pattern:string}, right?:{length:number, pattern:string}}} [padding]
 * @prop {{start:number, length:number}} [substr]
 * @prop {'left'|'right'|boolean} [trim]
 * @prop {CastingTypes} [cast]
 * @prop {Object} [compare]
 * @prop {string} [as]
 */

/**
 * numeric object
 * @typedef {Object} numericObject
 * @prop {number|string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {EncryptionConfig} [decimals]
 * @prop {number|string} [sub]
 * @prop {number|string} [add]
 * @prop {number|string} [power]
 * @prop {number|string} [divideBy]
 * @prop {number|string} [multiplyBy]
 * @prop {number|string} [mod]
 * @prop {CastingTypes} [cast]
 * @prop {Object} [compare]
 * @prop {string} [as]
 */

/**
 * date object
 * @typedef {Object} dateObject
 * @prop {string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {CastingTypes} [cast]
 * @prop {string} [fromPattern]
 * @prop {string} [format]
 * @prop {number|string} [sub]
 * @prop {number|string} [add]
 * @prop {{[key:string]:ComparatorObjects|BetweenWrapper}} [compare]
 * @prop {string} [as]
 */

/**
 * if object
 * @typedef {Object} IfObject
 * @prop {boolean|WhereObject} check
 * @prop {*} trueValue
 * @prop {*} falseValue
 * @prop {string} [as]
 */

/**
 * concat object
 * @typedef {Object} ConcatObject
 * @prop {SelectObject} value
 * @prop {string|number|boolean} pattern
 * @prop {WhereObject} [compare]
 * @prop {string} [as]
 */

/**
 * when then object
 * @typedef {Object} WhenThenCondition
 * @prop {boolean|WhereObject} when
 * @prop {string|number|boolean} then
 */

/**
 * Switch object
 * @typedef {Object} SwitchObject
 * @prop {Array<WhenThenCondition>} check
 * @prop {string|number|boolean} [else]
 * @prop {string} [as]
 */

/**
 * value options
 * @typedef {string|number|boolean|WrapperMethods} ValueOptions
 */

/**
 * values
 * @typedef {ValueOptions|ValueOptions[]} ValuesObject
 */

/**
 * comparators
 * @typedef {{eq:ValuesObject}|{notEq:ValuesObject}|{in:ValuesObject}|{notIn:ValuesObject}|{lt:ValuesObject}|{gt:ValuesObject}|{ltEq:ValuesObject}|{gtEq:ValuesObject}|{like:ValuesObject}|{startLike:ValuesObject}|{endLike:ValuesObject}|{notStartLike:ValuesObject}|{notEndLike:ValuesObject}} ComparatorObjects
 */

/**
 * partial query object
 * @typedef {Object} PartialQuery
 * @prop {string} [table]
 * @prop {string} [alias]
 * @prop {JoinObject} [join]
 * @prop {WhereObject} [where]
 * @prop {string[]} [groupBy]
 * @prop {HavingObject} [having]
 * @prop {{[key:string]:'asc'|'desc'}[]} [orderBy]
 * @prop {string} [as]
 */

/**
 * json base object
 * @typedef {Object} JsonObject
 * @prop {{[key:string]: ValuesObject}|Array} value
 * @typedef {PartialQuery & JsonObject} BaseJson
 */

/**
 * sub-query object
 * @typedef {Object} SubQuery
 * @prop {SelectObject} [select]
 * @typedef {PartialQuery & SubQuery} BaseQuery
 */

/**
 * sub-query object
 * @typedef {Object} JoinQuery
 * @prop {SelectObject} [select]
 * @prop {'left'|'right'|'inner'} [type]
 * @prop {(string|{[column:string]:string})[]} using
 * @typedef {PartialQuery & JoinQuery} BaseJoin
 */

/**
 * wrapper methods
 * @typedef {Object} WrapperMethods
 * @prop {stringObject} [str]
 * @prop {numericObject} [num]
 * @prop {dateObject} [date]
 * @prop {SwitchObject} [case]
 * @prop {IfObject} [if]
 * @prop {BaseJson} [json]
 * @prop {BaseJson} [array]
 * @prop {BaseQuery} [refer]
 * @prop {BetweenObject} [between]
 * @prop {(WrapperMethods|AggregateWrappers|CustomWrapper)[]} [and]
 * @prop {(WrapperMethods|AggregateWrappers|CustomWrapper)[]} [or]
 */

/**
 * aggregator methods
 * @typedef {Object} AggregateWrappers
 * @prop {BaseAggregate} [count]
 * @prop {BaseAggregate} [sum]
 * @prop {BaseAggregate} [min]
 * @prop {BaseAggregate} [max]
 * @prop {BaseAggregate} [avg]
 */


/**
 * select types
 * @typedef {ValuesObject|AggregateWrappers} selectTypes
 */

/**
 * select object
 * @typedef {selectTypes[]} SelectObject
 */

/**
 * custom wrapper
 * @typedef {{[key:string]:(ValuesObject|ComparatorObjects)}} CustomWrapper
 */

/**
 * where object
 * @typedef {(CustomWrapper|WrapperMethods)} WhereObject
 */

/**
 * having object
 * @typedef {AggregateWrappers|WhereObject} HavingObject
 */

/**
 * join object
 * @typedef {BaseJoin[]} JoinObject
 */

// Composite definitions end here


exports.unused = {}