// #######################################################################################################

//                                      UNIT TYPE DEF START HERE

// #######################################################################################################


/**
 * encryption object definition
 * @typedef {Object} encryption
 * @description used to define encryption / decryption parameters
 * 
 * @prop {string} [encryption.secret] encryption secret key / string
 * @prop {'aes-128-ecb'|'aes-256-cbc'} [encryption.mode] encryption mode
 * @prop {string} [encryption.iv] Initialization vector for encryption
 * @prop {224|256|384|512} [encryption.sha] encryption SHA2 bite size, default 512
 */


/**
 * using object definition
 * @typedef {Object} usingObject
 * 
 * @prop {{[key:string]: string}} usings
 */

/**
 * group by object definition
 * @typedef {Array<string>} groupByObject
 */

/**
 * sum aggregate function
 * @typedef {object} sumAggregator
 * 
 * @prop {object} sum used to sum the values
 * 
 * @prop {string|number|object} sum.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {string} sum.as
 */

/**
 * sum aggregate function
 * @typedef {object} sumCompareAggregator
 * 
 * @prop {object} sum used to sum the values
 * 
 * @prop {string|number|object} sum.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {object} sum.compare accepts object with conditions to compare this aggregator method with
 */

/**
 * avg aggregate function
 * @typedef {object} avgAggregator
 * 
 * @prop {object} avg used to avg the values
 * 
 * @prop {string|number|object} avg.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [avg.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {string} avg.as
 */

/**
 * average aggregate function
 * @typedef {object} avgCompareAggregator
 * 
 * @prop {object} avg used to average the values
 * 
 * @prop {string|number|object} avg.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [avg.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {object} avg.compare accepts object with conditions to compare this aggregator method with
 */

/**
 * count aggregate function
 * @typedef {object} countAggregator
 * 
 * @prop {object} count used to count the values
 * 
 * @prop {string|number|object} count.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {string} count.as
 */

/**
 * count aggregate function
 * @typedef {object} countCompareAggregator
 * 
 * @prop {object} count used to count the values
 * 
 * @prop {string|number|object} count.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {object} count.compare accepts object with conditions to compare this aggregator method with
 */

/**
 * min aggregate function
 * @typedef {object} minAggregator
 * 
 * @prop {object} min used to min the values
 * 
 * @prop {string|number|object} min.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {string} min.as
 */

/**
 * min aggregate function
 * @typedef {object} minCompareAggregator
 * 
 * @prop {object} min used to min the values
 * 
 * @prop {string|number|object} min.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {object} min.compare accepts object with conditions to compare this aggregator method with
 */

/**
 * max aggregate function
 * @typedef {object} maxAggregator
 * 
 * @prop {object} max used to max the values
 * 
 * @prop {string|number|object} max.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {string} max.as
 */

/**
 * max aggregate function
 * @typedef {object} maxCompareAggregator
 * 
 * @prop {object} max used to max the values
 * 
 * @prop {string|number|object} max.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {object} max.compare accepts object with conditions to compare this aggregator method with
 */

/**
 * and wrapper
 * @typedef {object} andWrapper
 * 
 * @prop {Array} and
 */

/**
 * or wrapper
 * @typedef {object} orWrapper
 * 
 * @prop {Array} or
 */

/**
 * prepares conditional statement
 * @typedef {object} whenThenCondition
 * 
 * @prop {boolean|string|number|sumCompareAggregator|avgCompareAggregator|countCompareAggregator|minCompareAggregator|maxCompareAggregator|andWrapper|orWrapper|{[key:string]:*}} whenThenCondition.when condition that needs to be checked
 * 
 * @prop {string|number} whenThenCondition.then value that will be returned when condition is found true in the 'when' statement
 */

// * @prop {Array<{when:object,then:(string|number|object)}>} case.conditions

/**
 * switch case wrapper
 * @typedef {object} switchWrapper
 * 
 * @prop {object} case
 * 
 * @prop {Array<whenThenCondition>} case.conditions array of conditions (object) containing 'when' and 'then' keys
 * 
 * @prop {string|number|object} case.else default value if none of the conditions are matched
 * 
 * @prop {string} case.as provides local reference name to the result of this switch case wrapper method
 */

/**
 * if else condition wrapper
 * @typedef {object} ifWrapper
 * 
 * @prop {object} if
 * 
 * @prop {boolean|string|object} if.condition check this condition if it is true or false
 * 
 * @prop {string|number|boolean|*} if.trueValue return this value if 'condition' is true
 * 
 * @prop {string|number|boolean|*} if.falseValue return this value if 'condition' is false
 * 
 * @prop {string} [if.as] provides local reference name to the result of this switch case wrapper method
 */

// #######################################################################################################

//                                      UNIT TYPE DEF END HERE

// #######################################################################################################







// #######################################################################################################

//                                      WRAPPERS TYPE DEF START HERE

// #######################################################################################################


/**
 * string method wrapper
 * @typedef {Object} stringWrapper
 * 
 * string method
 * @prop {Object} str
 * 
 * @prop {string|Array<string>} str.value accepts column name / string value (in array) to perform string methods on
 * 
 * @prop {{'target':{target:string, with:string}}} [str.replace] (optional) replaces 'target' content 'with' string pattern provided
 * 
 * @prop {boolean} [str.reverse] (optional) reverses the order of characters in output string
 * 
 * @prop {'upper'|'lower'} [str.textCase] (optional) transforms text to 'upper' or 'lower' case
 * 
 * @prop {string|string[]|number} [str.search] (optional) searches for a string / number in the 'value' property, if found returns the starting index value else returns 0
 * 
 * @prop {{'left'?:{length:number, pattern:string}, 'right'?:{length:number, pattern:string}}} [str.padding] (optional) applies 'left' and (or) 'right' padding to the 'value' property, 'length' determines the padding amount and 'pattern' is used to fill the additionally required places (if length of 'value' property is smaller that 'length' property) else ignored
 * 
 * @prop {{start:number, length:number}} [str.substr] (optional) creates a sub-string using the values of start index and length
 * 
 * @prop {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} [str.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [str.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * 
 * @prop {string} [str.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * concat method wrapper
 * @typedef {Object} concatWrapper
 * 
 * concat method
 * @prop {Object} concat concatenation of values in the 'value' property, value from 'pattern' property is used to connect them
 * 
 * @prop {Array<string|number|Array<string>>} concat.value accepts column name / string value (in array) to perform string methods on
 * 
 * @prop {string} concat.pattern (optional) used to concat 'value' property
 * 
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [concat.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * 
 * @prop {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} [concat.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {'upper'|'lower'} [concat.textCase] (optional) transforms text to 'upper' or 'lower' case
 * 
 * @prop {Array<number>} [concat.substr] (optional) creates a sub-string using the values of start index and length
 * 
 * @prop {string|string[]|number} [concat.search] (optional) searches for a string / number in the 'value' property, if found returns the starting index value else returns 0
 * 
 * @prop {string} [concat.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * number method wrapper
 * @typedef {Object} numericWrapper
 * 
 * number method
 * @prop {Object} num
 * 
 * @prop {number|string} num.value accepts column name / number value (in array) to perform number methods on
 * 
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [num.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * 
 * @prop {'round'|'floor'|'ceil'|number} [num.decimals] (optional) used to limit the decimal values to certain decimal places or round-up using any of the 'ceil', 'floor' or 'round' criteria values
 * 
 * @prop {number} [num.sub] (optional) applies subtraction to 'value' property, follows the rule of BODMAS principle for application
 * 
 * @prop {number} [num.add] (optional) applies addition to 'value' property, follows the rule of BODMAS principle for application
 * 
 * @prop {number} [num.power] (optional) applies numeric power to 'value' property, follows the rule of BODMAS principle for application
 * 
 * @prop {number} [num.divideBy] (optional) divides the 'value' property by this number, follows the rule of BODMAS principle for application
 * 
 * @prop {number} [num.multiplyBy] (optional) multiplies the 'value' property by this number, follows the rule of BODMAS principle for application
 * 
 * @prop {number} [num.mod] (optional) provides remainder after dividing the 'value' property by this number, follows the rule of BODMAS principle for application
 * 
 * @prop {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} [num.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [num.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * date method wrapper
 * @typedef {Object} dateWrapper
 * 
 * date method
 * @prop {Object} date
 * 
 * @prop {string|Array<string>} date.value accepts column name / string value (in array) to perform string methods on
 * 
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [date.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * 
 * @prop {number|string} [date.add] (optional) adds no. of second(s) / minute(s) / hour(s) / day(s) / month(s) / year(s) to the 'value' property
 * 
 * @prop {number|string} [date.sub] (optional) subtracts no. of second(s) / minute(s) / hour(s) / day(s) / month(s) / year(s) to the 'value' property
 * 
 * @prop {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} [date.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [date.fromPattern] (optional) format the date into a specific pattern
 * 
 * @prop {string} [date.format] (optional) format the date into a specific pattern
 * 
 * @prop {string} [date.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * json object wrapper
 * @typedef {object} jsonObjWrapper
 * 
 * json wrapper
 * @prop {object} json
 * 
 * @prop {object} json.value accepts object as key value map
 * 
 * @prop {object} [json.table] (optional) reference of the table on which this sub-query is dependent
 * 
 * @prop {object} [json.alias] (optional) local reference name of the table, only needed if table name is also provided in 'from' property
 * 
 * @prop {{[key:string]:*}} [json.where]  (optional) allows to filter records using various conditions
 * 
 * @prop {object} [json.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * json array wrapper
 * @typedef {object} jsonArrayWrapper
 * 
 * array wrapper
 * @prop {object} array
 * 
 * @prop {object} array.value accepts array of values
 * 
 * @prop {object} [array.table] (optional) reference of the table on which this sub-query is dependent
 * 
 * @prop {object} [array.alias] (optional) local reference name of the table, only needed if table name is also provided in 'from' property
 * 
 * @prop {{[key:string]:*}} [array.where]  (optional) allows to filter records using various conditions
 * 
 * @prop {object} [array.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * join object used to associate child table(s) with parent table
 * @typedef {object} joinObj
 * 
 * @prop {selectObj} [joinObj.select] (optional) select limited columns from the table
 * 
 * @prop {'left'|'right'|'inner'|'outer'} [joinObj.type] (optional) type of table association
 * 
 * @prop {string} joinObj.table reference to the child table
 * 
 * @prop {string} [joinObj.alias] (optional) local reference name of the table
 * 
 * @prop {Array<joinObj>} [joinObj.join] (optional) array of nested join object
 * 
 * @prop {{[key:string]:*}} [joinObj.where] (optional) allows to filter records in the associated child table using various conditions
 * 
 * @prop {('and'|'or')} [joinObj.junction] (optional) clause used to connect multiple where conditions, default value is 'and'
 * 
 * @prop {Array<string>} [joinObj.groupBy] (optional) accepts array of column name(s) that allow to group child records based on single (or list of) column(s)
 * 
 * @prop {import("./defs/types.def").havingObj} [joinObj.having] (optional) allows to perform comparison on the group of records, accepts array of aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
 * 
 * @prop {{[column:string]:('asc'|'desc')}} [joinObj.orderBy] (optional) allows to order result based on single (or list of) column(s)
 * 
 * @prop {Array} joinObj.using array of common column  / object of key value pair 
 * 
 * @prop {string} [joinObj.as] (optional) reference the joining condition for future usage
 * 
 */

/**
 * from sub query wrapper
 * @typedef {object} fromWrapper
 * 
 * @prop {object} from
 * 
 * @prop {selectObj} from.select defines the column to be fetched from the referred table
 * 
 * @prop {string} from.table reference to the child table
 * 
 * @prop {string} [from.alias] (optional) local reference name of the table
 * 
 * @prop {Array<joinObj>} [from.join] (optional) array of nested join object
 * 
 * @prop {{[key:string]:*}} [from.where] (optional) allows to filter records in the associated child table using various conditions
 * 
 * @prop {('and'|'or')} [from.junction] (optional) clause used to connect multiple where conditions
 * 
 * @param {Array<string>} [from.groupBy] (optional) allows to group result based on single (or list of) column(s)
 * 
 * @param {import("./defs/types.def").havingObj} [from.having] (optional) allows to perform comparison on the group of records, accepts array of aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
 * 
 * @param {{[column:string]:('asc'|'desc')}} [from.orderBy] (optional) allows to order result based on single (or list of) column(s)
 * 
 * @param {number} [from.limit] (optional) limits the number of records to be fetched from the database table
 * 
 * @param {number} [from.offset] (optional) determines the starting index for records to be fetched from the database table
 * 
 * @prop {string} [from.as] (optional) reference the joining condition for future usage
 */

// #######################################################################################################

//                                      WRAPPERS TYPE DEF END HERE

// #######################################################################################################





// #######################################################################################################

//                                      COMPOSITE TYPE DEF START HERE

// #######################################################################################################


/**
 * config object type
 * @typedef {Object} config
 * 
 * @prop {string} config.table name of the table in the database
 * 
 * @prop {object} [config.connection] MySQL connection object
 * 
 * @prop {object} [config.pool] MySQL connection pool object
 * 
 * @prop {boolean} [config.map] (optional) map enables to consider this model to be considered while migration, default 'true'
 * 
 * @prop {boolean} config.safeMode (optional) safe mode helps avoiding accidental delete of all method without 'where' property, default 'true'
 * 
 * @prop {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [config.encryption] (optional) used to define encryption / decryption parameters
 * 
 * 
 */


/**
 * Select object definition
 * @typedef {Array<Array<string>|boolean|number|string|stringWrapper|numericWrapper|dateWrapper|concatWrapper|jsonObjWrapper|jsonArrayWrapper|fromWrapper|sumAggregator|avgAggregator|minAggregator|maxAggregator|switchWrapper|ifWrapper|{[column:string]:string}} selectObj
 * 
 * @description accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...} etc
 * 
 */

/**
 * having object definition
 * @typedef {sumCompareAggregator|avgCompareAggregator|{and: Array}|{or: Array}|{[key:string]:*}} havingObj
 */

// #######################################################################################################

//                                      COMPOSITE TYPE DEF END HERE

// #######################################################################################################


exports.unused = {}