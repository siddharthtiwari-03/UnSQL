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
 * @typedef {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'|'integer'} CastingTypes
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
 * @prop {boolean} [safeMode=true] protects accidental execution of 'delete-all'
 * @prop {boolean} [devMode=false] prevents 'reset' of data, enables Export/Import of records
 * @prop {Object} [connection] mysql 'connection' object
 * @prop {Object} [pool] mysql connection 'pool' object
 * @prop {'mysql'|'postgresql'|'sqlite'} [dialect='mysql'] dialect to be used
 * @prop {'unknown'|EncryptionModes} [dbEncryptionMode='unknown'] dialect to be used
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
 * @typedef {Object} StringObject
 * @prop {string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {string} [encoding]
 * @prop {boolean} [reverse]
 * @prop {'upper'|'lower'} [textCase]
 * @prop {{target:string, replaceWith:string}} [replace]
 * @prop {{left?:{length:number, pattern:string}, right?:{length:number, pattern:string}}} [padding]
 * @prop {{start:number, length:number}} [substr]
 * @prop {'left'|'right'|boolean} [trim]
 * @prop {CastingTypes} [cast]
 * @prop {ValuesObject|ComparatorObjects} [compare]
 * @prop {string} [as]
 */

/**
 * numeric object
 * @typedef {Object} NumericObject
 * @prop {number|string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {string} [encoding]
 * @prop {EncryptionConfig} [encrypt]
 * @prop {'floor'|'ceil'|'round'|number} [decimals]
 * @prop {number|string} [sub]
 * @prop {number|string} [add]
 * @prop {number|string} [power]
 * @prop {number|string} [divideBy]
 * @prop {number|string} [multiplyBy]
 * @prop {number|string} [mod]
 * @prop {CastingTypes} [cast]
 * @prop {ValuesObject|ComparatorObjects} [compare]
 * @prop {string} [as]
 */

/**
 * date object
 * @typedef {Object} DateObject
 * @prop {string} value
 * @prop {EncryptionConfig} [decrypt]
 * @prop {string} [encoding]
 * @prop {EncryptionConfig} [encrypt]
 * @prop {CastingTypes} [cast]
 * @prop {string} [fromPattern]
 * @prop {string} [format]
 * @prop {number|string} [sub]
 * @prop {number|string} [add]
 * @prop {ValuesObject|ComparatorObjects} [compare]
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
 * @prop {boolean} [reverse]
 * @prop {'upper'|'lower'} [textCase]
 * @prop {{left?:{length:number, pattern:string}, right?:{length:number, pattern:string}}} [padding]
 * @prop {{start:number, length:number}} [substr]
 * @prop {'left'|'right'|boolean} [trim]
 * @prop {ValuesObject|ComparatorObjects} [compare]
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
 * @typedef {{eq:ValuesObject}|{notEq:ValuesObject}|{in:ValuesObject}|{notIn:ValuesObject}|{lt:ValuesObject}|{gt:ValuesObject}|{ltEq:ValuesObject}|{gtEq:ValuesObject}|{like:ValuesObject}|{notLike:ValuesObject}|{startLike:ValuesObject}|{endLike:ValuesObject}|{notStartLike:ValuesObject}|{notEndLike:ValuesObject}} ComparatorObjects
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
 * @prop {number} [limit]
 * @prop {number} [offset]
 * @prop {string} [as]
 */

/**
 * json base object
 * @typedef {Object} JsonObject
 * @prop {string|{[key:string]: ValuesObject}|Array} value
 * @prop {boolean} [aggregate]
 * @prop {string} [extract]
 * @prop {string|number|boolean|Array<string|number|boolean>} [contains]
 * @prop {ComparatorObjects} [compare]
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
 * @prop {'left'|'right'|'inner'|'fullOuter'|'cross'} [type]
 * @prop {string[]|{[column:string]:string}} using
 * @typedef {PartialQuery & JoinQuery} BaseJoin
 */

/**
 * wrapper methods
 * @typedef {Object} WrapperMethods
 * @prop {StringObject} [str]
 * @prop {NumericObject} [num]
 * @prop {DateObject} [date]
 * @prop {ConcatObject} [concat]
 * @prop {SwitchObject} [case]
 * @prop {IfObject} [if]
 * @prop {BaseJson} [json]
 * @prop {BaseJson} [array]
 * @prop {BaseQuery} [refer]
 */

/**
 * composite methods
 * @typedef {Object} CompositeMethods
 * @prop {(WrapperMethods|AggregateWrappers|CustomWrapper)[]} [and]
 * @prop {(WrapperMethods|AggregateWrappers|CustomWrapper)[]} [or]
 * @prop {BetweenObject} [between]
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
 * @typedef {{[key:string]:(ValuesObject|ComparatorObjects|{between:BetweenObject})}} CustomWrapper
 */

/**
 * where object
 * @typedef {(ValuesObject|CustomWrapper|WrapperMethods|CompositeMethods)} WhereObject
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