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
 * @prop {string|number|valueObj} sum.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [sum.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [sum.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [sum.as] (optional) local reference name to the value returned by this aggregate method
 * 
 * @prop {whereObj} [sum.compare] accepts object with conditions to compare this aggregator method with
 */

/**
 * avg aggregate function
 * @typedef {object} avgAggregator
 * 
 * @prop {object} avg used to avg the values
 * 
 * @prop {string|number|valueObj} avg.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [avg.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [avg.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [avg.as] (optional) local reference name to the value returned by this aggregate method
 * 
 * @prop {whereObj} [avg.compare] accepts object with conditions to compare this aggregator method with
 */

/**
 * count aggregate function
 * @typedef {object} countAggregator
 * 
 * @prop {object} count used to count the values
 * 
 * @prop {string|number|valueObj} count.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [count.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [count.as] (optional) local reference name to the value returned by this aggregate method
 * 
 * @prop {whereObj} [count.compare] accepts object with conditions to compare this aggregator method with
 */

/**
 * min aggregate function
 * @typedef {object} minAggregator
 * 
 * @prop {object} min used to min the values
 * 
 * @prop {string|number|valueObj} min.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [min.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [min.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [min.as] (optional) local reference name to the value returned by this aggregate method
 * 
 * @prop {whereObj} [min.compare] (optional) accepts object with conditions to compare this aggregate method with
 */

/**
 * max aggregate function
 * @typedef {object} maxAggregator
 * 
 * @prop {object} max used to max the values
 * 
 * @prop {string|number|valueObj} max.value accepts a number / string (column name) / object wrapper / conditional object as its value
 * 
 * @prop {boolean} [max.distinct] (optional) used to identify if the 'distinct' records needs to be considered inside this aggregate method
 * 
 * @prop {('char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary')} [max.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {string} [max.as] (optional) local reference name to the value returned by this aggregate method
 * 
 * @prop {whereObj} [max.compare] (optional) accepts object with conditions to compare this aggregate method with
 */

/**
 * only aggregate wrapper methods
 * @typedef {avgAggregator|sumAggregator|countAggregator} aggregateWrappers
 */

/**
 * only wrapper methods
 * @typedef {aggregateWrappers|andWrapper|orWrapper|stringWrapper|numericWrapper|dateWrapper|concatWrapper} wrapperMethods
 */

/**
 * and wrapper
 * @typedef {object} andWrapper
 * 
 * @prop {Array<wrapperMethods|{[column: string]: valueObj} >} andWrapper.and
 */

/**
 * and wrapper
 * @typedef {object} orWrapper
 * 
 * @prop {Array<wrapperMethods|{[column: string]: valueObj} >} orWrapper.or
 */

/**
 * between wrapper
 * @typedef {object} betweenWrapper
 * 
 * @prop {{lt: number|string, gt: number|string}} betweenWrapper.between
 * 
 * @prop {string} [betweenWrapper.as]
 */

/**
 * prepares conditional statement
 * @typedef {object} whenThenCondition
 * 
 * @param { whereObj } whenThenCondition.when condition that needs to be checked
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
 * @prop {Array<whenThenCondition>} case.check array of conditions (object) containing 'when' and 'then' keys
 * 
 * @prop {string|number|object} case.else default value if none of the conditions are matched
 * 
 * @prop {string} [case.as] provides local reference name to the result of this switch case wrapper method
 */

/**
 * if else condition wrapper
 * @typedef {object} ifWrapper
 * 
 * @prop {object} if
 * 
 * @param {whereObj} if.check checks the condition if it is true or false
 * 
 * @prop {valueObj} if.trueValue return this value if 'condition' is true
 * 
 * @prop {valueObj} if.falseValue return this value if 'condition' is false
 * 
 * @prop {string} [if.as] provides local reference name to the result of this switch case wrapper method
 */

/**
 * @typedef {string|number|boolean|fromWrapper|stringWrapper|numericWrapper|dateWrapper|concatWrapper|aggregateWrappers|betweenWrapper|switchWrapper|ifWrapper} valueObj
 */

/**
 * comparator wrapper
 * @typedef { { eq: valueObj } | { notEq: valueObj } | { lt: valueObj } | { gt: valueObj } | { in: valueObj } | { notIn: valueObj } | { like: valueObj } | { startLike: valueObj } | { notStartLike: valueObj } | { endLike: valueObj } | { notEndLike: valueObj } | { isNull: valueObj } } compareObj
 */

// #######################################################################################################

//                                      UNIT TYPE DEF END HERE

// #######################################################################################################







// #######################################################################################################

//                                      WRAPPERS TYPE DEF START HERE

// #######################################################################################################

/**
 * string obj
 * @typedef {object} strObj
 * 
 * @prop {string} strObj.value accepts column name / string value (in array) to perform string methods on
 * 
 * @prop {{'target':{target:string, with:string}}} [strObj.replace] (optional) replaces 'target' content 'with' string pattern provided
 * 
 * @prop {boolean} [strObj.reverse] (optional) reverses the order of characters in output string
 * 
 * @prop {'upper'|'lower'} [strObj.textCase] (optional) transforms text to 'upper' or 'lower' case
 * 
 * @prop {string|string[]|number} [strObj.search] (optional) searches for a string / number in the 'value' property, if found returns the starting index value else returns 0
 * 
 * @prop {{'left'?:{length:number, pattern:string}, 'right'?:{length:number, pattern:string}}} [strObj.padding] (optional) applies 'left' and (or) 'right' padding to the 'value' property, 'length' determines the padding amount and 'pattern' is used to fill the additionally required places (if length of 'value' property is smaller that 'length' property) else ignored
 * 
 * @prop {{start:number, length:number}} [strObj.substr] (optional) creates a sub-string using the values of start index and length
 * 
 * @prop {'char'|'nchar'|'date'|'dateTime'|'signed'|'unsigned'|'decimal'|'binary'} [strObj.cast] (optional) enables casting of 'value' property into any of the valid types
 * 
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [strObj.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * 
 * @prop {string} [strObj.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 * @prop {whereObj} [strObj.compare] (optional) used chain the value returned by this wrapper method with comparison object
 */


/**
 * string method wrapper
 * @typedef {Object} stringWrapper
 * 
 * string method
 * @prop {Object} str
 * 
 * @prop {string} str.value accepts column name / string value (in array) to perform string methods on
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
 * @prop {whereObj} [str.compare] (optional) used chain the value returned by this wrapper method with comparison object
 */

/**
 * concat method wrapper
 * @typedef {Object} concatWrapper
 * 
 * concat method
 * @prop {Object} concat concatenation of values in the 'value' property, value from 'pattern' property is used to connect them
 * 
 * @prop {Array<valueObj>} concat.value accepts column name / string value (in array) to perform string methods on
 * 
 * @prop {string|boolean|number} concat.pattern (optional) used to concat 'value' property
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
 * @prop {whereObj} [concat.compare] (optional) used chain the value returned by this wrapper method with comparison object
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
 * @prop {whereObj} [num.compare] (optional) used chain the value returned by this wrapper method with comparison object
 */

/**
 * date method wrapper
 * @typedef {Object} dateWrapper
 * 
 * date method
 * @prop {Object} date
 * 
 * @prop {string} date.value accepts column name / string value (in array) to perform string methods on
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
 * @prop {whereObj} [date.compare] (optional) used chain the value returned by this wrapper method with comparison object
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
 * @prop {string} [json.table] (optional) reference of the table on which this sub-query is dependent
 * 
 * @prop {string} [json.alias] (optional) local reference name of the table, only needed if table name is also provided in 'from' property
 * 
 * @prop {whereObj} [json.where]  (optional) allows to filter records using various conditions
 * 
 * @prop {string} [json.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 * 
 */

/**
 * json array wrapper
 * @typedef {object} jsonArrayWrapper
 * 
 * array wrapper
 * @prop {object} array
 * 
 * @prop {object|Array} array.value accepts array of values
 * 
 * @prop {string} [array.table] (optional) reference of the table on which this sub-query is dependent
 * 
 * @prop {string} [array.alias] (optional) local reference name of the table, only needed if table name is also provided in 'from' property
 * 
 * @prop {whereObj} [array.where]  (optional) allows to filter records using various conditions
 * 
 * @prop {string} [array.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
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
 * @prop {whereObj} [joinObj.where] (optional) allows to filter records in the associated child table using various conditions
 * 
 * @prop {('and'|'or')} [joinObj.junction] (optional) clause used to connect multiple where conditions, default value is 'and'
 * 
 * @prop {Array<string>} [joinObj.groupBy] (optional) accepts array of column name(s) that allow to group child records based on single (or list of) column(s)
 * 
 * @prop {havingObj} [joinObj.having] (optional) allows to perform comparison on the group of records, accepts array of aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
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
 * @prop {whereObj} [from.where] (optional) allows to filter records in the associated child table using various conditions
 * 
 * @prop {('and'|'or')} [from.junction] (optional) clause used to connect multiple where conditions
 * 
 * @param {Array<string>} [from.groupBy] (optional) allows to group result based on single (or list of) column(s)
 * 
 * @param {havingObj} [from.having] (optional) allows to perform comparison on the group of records, accepts array of aggregate method wrappers viz. {sum:...}, {avg:...}, {min:...}, {max:...} etc
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
 * Select object definition
 * @typedef {Array<valueObj|jsonObjWrapper|jsonArrayWrapper|{[column:string]:string}} selectObj
 * 
 * @description accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...} etc
 * 
 */

/**
 * having object definition
 * @typedef {aggregateWrappers|andWrapper|orWrapper|{[key:string]:*}} havingObj
 */

/**
 * where object
 * @typedef { (stringWrapper | dateWrapper | numericWrapper | andWrapper | orWrapper | aggregateWrappers) | ({[key:(string|number)]: (valueObj|compareObj)}) } whereObj
 */

// #######################################################################################################

//                                      COMPOSITE TYPE DEF END HERE

// #######################################################################################################


exports.unused = {}