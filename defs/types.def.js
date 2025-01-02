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
 * encrypt type definition
 * @typedef {{string, encryption}} encrypt
 * 
 */

/**
 * encrypt object definition
 * @typedef {Object} encryptObject
 * 
 * @prop {encrypt} encrypt
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
 * @prop {string|Array<string>} str.value accepts column name / string value (in array) to perform string methods on
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [str.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * @prop {'char'|'binary'|'signed'|'unsigned'} [str.cast] (optional) enables casting of 'value' property into any of the valid types
 * @prop {'upper'|'lower'} [str.case] (optional) transforms text to 'upper' or 'lower' case
 * @prop {string|string[]|number} [str.search] (optional) searches for a string / number in the 'value' property, if found returns the starting index value else returns 0
 * @prop {Array<number>} [str.substr] (optional) creates a sub-string using the values of start index and length
 * @prop {string} [str.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 */

/**
 * concat method wrapper
 * @typedef {Object} concatWrapper
 * 
 * concat method
 * @prop {Object} concat concatenation of values in the 'value' property, value from 'pattern' property is used to connect them
 * @prop {Array<string|number|Array<string>>} concat.value accepts column name / string value (in array) to perform string methods on
 * @prop {string} concat.pattern (optional) used to concat 'value' property
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [concat.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * @prop {'char'|'binary'|'signed'|'unsigned'} [concat.cast] (optional) enables casting of 'value' property into any of the valid types
 * @prop {'upper'|'lower'} [concat.case] (optional) transforms text to 'upper' or 'lower' case
 * @prop {Array<number>} [concat.substr] (optional) creates a sub-string using the values of start index and length
 * @prop {string|string[]|number} [concat.search] (optional) searches for a string / number in the 'value' property, if found returns the starting index value else returns 0
 * @prop {string} [concat.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 */

/**
 * number method wrapper
 * @typedef {Object} numericWrapper
 * 
 * number method
 * @prop {Object} num
 * @prop {number|string} num.value accepts column name / number value (in array) to perform number methods on
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [num.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * @prop {'round'|'floor'|'ceil'|number} [num.decimals] (optional) used to limit the decimal values to certain decimal places or round-up using any of the 'ceil', 'floor' or 'round' criteria values
 * @prop {number} [num.power] (optional) applies numeric power to 'value' property, follows the rule of BODMAS principle for application
 * @prop {number} [num.divideBy] (optional) divides the 'value' property by this number, follows the rule of BODMAS principle for application
 * @prop {number} [num.multiply] (optional) multiplies the 'value' property by this number, follows the rule of BODMAS principle for application
 * @prop {number} [num.mod] (optional) provides remainder after dividing the 'value' property by this number, follows the rule of BODMAS principle for application
 * @prop {'char'|'binary'|'signed'|'unsigned'} [num.cast] (optional) enables casting of 'value' property into any of the valid types
 * @prop {string} [num.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
 */

/**
 * date method wrapper
 * @typedef {Object} dateWrapper
 * 
 * date method
 * @prop {Object} date
 * @prop {string|Array<string>} date.value accepts column name / string value (in array) to perform string methods on
 * @prop {{secret?:string, sha?:(224|256|384|512), iv?:string}} [date.decrypt] (optional) property to configure decryption configurations (local) for this 'value' property
 * @prop {number|string} [date.add] (optional) adds no. of second(s) / minute(s) / hour(s) / day(s) / month(s) / year(s) to the 'value' property
 * @prop {number|string} [date.sub] (optional) subtracts no. of second(s) / minute(s) / hour(s) / day(s) / month(s) / year(s) to the 'value' property
 * @prop {'char'|'binary'|'signed'|'unsigned'} [date.cast] (optional) enables casting of 'value' property into any of the valid types
 * @prop {{}} [date.decrypt] (optional) format the date into a specific pattern
 * @prop {string} [date.format] (optional) format the date into a specific pattern
 * @prop {string} [date.as] (optional) rename the value returned by this wrapper method by rename / tagging with local name using 'as' property
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
 * @prop {object} [config.connection] MySQL connection object
 * @prop {object} [config.pool] MySQL connection pool object
 * @prop {boolean} [config.map] (optional) map enables to consider this model to be considered while migration, default 'true'
 * @prop {boolean} config.safeMode (optional) safe mode helps avoiding accidental delete of all method without 'where' property, default 'true'
 * @prop {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [config.encryption] (optional) used to define encryption / decryption parameters
 * 
 */


/**
 * Select object definition
 * @typedef {Array<Array<string>|boolean|number|string|stringWrapper|numericWrapper|dateWrapper|concatWrapper} selectObject
 * 
 * @description accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...} etc
 * 
 */

/**
 * Join query object
 * @typedef {Object} joinObject specifies properties required to join another table as child with parent table
 * 
 * @prop {string} joinObject.table name of the child table in the database to join with parent model class
 * @prop {string} [joinObject.alias] (optional) local alias name given to the table name
 * @prop {selectObject} [joinObject.select] (optional) accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...} etc
 * @prop {Array<string|object>} joinObject.using array of column names / objects with key value where key is the column name from the parent table and value is the column name from the child table
 * @prop {object} [joinObject.where] (optional) allows to filter records using various conditions
 * @prop {string} [joinObject.as] (optional) used to assign a local name to the join object (Only in case of 'select' or 'where' properties are used inside this join object) to be used in 'select' or 'where' property of the parent
 * 
 * 
 */


// #######################################################################################################

//                                      COMPOSITE TYPE DEF END HERE

// #######################################################################################################





// #######################################################################################################

//                                      METHOD PARAMS TYPE DEF END HERE

// #######################################################################################################


/**
 * find query object definition
 * @typedef {Object} findObject
 * 
 * @prop {string} [findObject.alias] (optional) local alias name for the database table
 * @prop {selectObject} [findObject.select] (optional) accepts different types of values inside parent array: a. column name as regular 'string' value, b. string value inside array ['string'] for string value that is not a column name, c. number and boolean directly and d. methodWrappers in object form like {str:...}, {num:...} etc
 * @prop {'and'|'or'} [findObject.junction] (optional) defines default behavior that is used to join different 'child properties' inside 'where' property, default value is 'and'
 * @prop {Array<joinObject>} [findObject.join] (optional) allows to join child tables to this model class
 * @prop {object} [findObject.where] (optional) allows to filter records using various conditions
 * @prop {Array<string>} [findObject.groupBy] (optional) allows to group result based on single (or list of) column(s)
 * @prop {number} [findObject.limit] (optional) limits the number of records to be fetched from the database table
 * @prop {number} [findObject.offset] (optional) determines the starting index for records to be fetched from the database table
 * @prop {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512)}} [findObject.encryption] (optional) enables various debug mode
 * @prop {boolean|'query'|'error'} [findObject.debug] (optional) enables various debug mode
 * 
 */

/**
 * save query object definition
 * @typedef {Object} saveObject
 * 
 * @prop {Array<Object>|Object} saveObject.data object / array of objects to be inserted into the database table
 * @prop {Object} [saveObject.where] (optional) used to filter records to be updated
 * @prop {Object} [saveObject.upsert] (optional) object data to be updated in case of 'duplicate key entry' found in the database
 * @prop {{[column:string]:{secret?:string, iv?:string, sha?:(224|256|384|512)} }} [saveObject.encrypt] (optional) define encryption overrides for column(s)
 * @prop {{mode?:('aes-128-ecb'|'aes-256-cbc'), secret?:string, iv?:string, sha?:(224|256|384|512) }} [saveObject.encryption] (optional) enables various debug mode
 * @prop {boolean|'query'|'error'} [saveObject.debug] (optional) enables various debug mode
 * 
 */

/**
 * delete query object definition
 * @typedef {Object} deleteObject
 * 
 * @prop {Object} [deleteObject.where] (optional) used to filter records to be deleted
 * @prop {boolean|'query'|'error'} [deleteObject.debug] (optional) enables various debug mode
 * 
 */

// #######################################################################################################

//                                      METHOD PARAMS TYPE DEF END HERE

// #######################################################################################################




exports.unused = {}