# UnSQL

UnSQL is an open source library, written in JavaScript, that provides class based clean and modern interface, while facilitating dynamic query generation under the hood, to interact with structured Database (MySQL). UnSQL is compatible with JavaScript based runtimes like Node.js and Next.js.

## Breaking Changes

Beyond the version v2+ backward compatibility has been dropped, from the default import, in favour of security and features. For projects still running on version v1.x we recommend switching all the import/require of `'unsql'` in your existing `model` classes to legacy flag `unsql/legacy`

## What's New?

With the release of v2.0 UnSQL has been completely re-written with a even better engine and newer interface along with addition of new features like:

- Built-in AES based encryption / decryption modes,
- Built-in multiple debug modes to choose from,
- All internal errors are now handled, hence eliminating the requirement for external catch block,
- Object based params and properties for interaction,
- Dynamic query generation now uses placeholders for everything,
- Built-in jsdoc compatible type definitions for type checking and support for better code suggestions or intellisense.

## Features

- Promise based
- Class based models
- Support for MySQL connection / MySQL connection pool
- Dynamic query generation
- Transactions based query execution
- Query success or failure acknowledgement
- Graceful error handling and transaction rollbacks
- Returns result as JSON object
- Try-Catch block not required
- JSDoc type compatibile for type checking and code suggestion
- Three built-in debug modes
- Built-in AES encryption and decryption methods to support multiple modes (ECB / CBC)

## Installation

Install `UnSQL` to your project using **npm**

```bash
npm install unsql
```

OR

```bash
npm i unsql
```

### Prerequisite

UnSQL requires mysql connection or connection pool to connect to the MySQL database. **`mysql2`** is the most commonly used package for this purpose.

## How UnSQL works?

UnSQL is class based, therefore the first step is to create model class for each table in the database. Each of these models (classes) must extend from the UnSQL base class. Later, these model classes can be used to perform desired operations via. different built-in methods.

### How to import UnSQL in the model class?

UnSQL can be imported using any of the following:

1. CommonJS import
```javascript
const UnSQL = require('unsql')
```

2. ES6 Module import
```javascript
import UnSQL from 'unsql'
```

> **Please note:** If you are still using version v1.x use 'unsql/legacy' instead of 'unsql'

## Model Class (Example)

Below is the example for a model class using both CommonJS and ES6 module. Here, class named **`User`**, extending from the **`UnSQL`** base class, is defined inside the _`user.class.js`_ file. For explanation, _mysql connection **pool**_ is used.

1. user.class.js (CommonJS)
```javascript
// @ts-check
const UnSQL = require('unsql')

// get connection pool from your mysql provider service
const pool = require('path_to_your_mysql_service')

/**
 * @class User
 * @extends UnSQL
 */
class User extends UnSQL {

    /**
     * UnSQL config
     * @type {UnSQL.config}
     */
    static config = {
        table: 'replace_with_user_table_name', // (mandatory)
        pool, // replace 'pool' with 'connection' if you wish to use single connection instead of connection pool
        safeMode: true
    }

}
module.exports = { User }
```

2. user.class.js (ES6 Module)
```javascript
// @ts-check
import UnSQL from 'unsql'

// get connection pool from your mysql provider service
import pool from 'path_to_your_mysql_service'

/**
 * @class User
 * @extends UnSQL
 */
export class User extends UnSQL {

    /**
     * UnSQL config
     * @type {UnSQL.config}
     */
    static config = {
        table: 'replace_with_user_table_name', // (mandatory)
        pool, // replace 'pool' with 'connection' if you wish to use single connection instead of connection pool
        safeMode: true
    }

}
```

### What is config inside UnSQL model class?

**config** is a _static_ object that is used to define the configurations related to that specific model class. Below are the list of properties **config** object accepts:
- **table**: (mandatory) accepts name of the table in the database,
- **pool**: (optional) accepts mysql connection pool object,
- **connection**: (optional) accepts mysql connection object
- **safeMode**: accepts boolean value, helps avoiding accidental *delete all* due to missing 'where' property in 'delete' method

> **Please note:** value for either or the two: **pool** or **connection** property must provided. **pool** takes priority over **connection** in case value for both are provided

## What are the built-in methods in UnSQL model class?

UnSQL provides three (03) methods, to perform the **CRUD** operations using these model classes. Each of these methods accepts object as their parameter with various properties.

| Method       | Description                                                               |
| ------------ | ------------------------------------------------------------------------- |
| **`find`**   | (static) used to fetch records from the database table                    |
| **`save`**   | (static) used to insert / update / upsert record(s) in the database table |
| **`delete`** | (static) used to remove record(s) from the database table                 |

### How find query / method works in UnSQL?

**`find`** is a static, asynchronous method. It dynamically generates *select* query, that is used to read / retrieve data from the database table. This method is called directly via. referencing the class, it accepts object as its parameter (Also referred as **findObj** in this documentation). **`find`** method along with **findObj** and all its parameters with their default values is shown below:

```javascript

const findObj = {
    alias: undefined,
    select: ['*'],
    join: [],
    where: {},
    junction: 'and',
    groupBy: [],
    having: [],
    orderBy: {},
    limit: undefined,
    offset: undefined,
    encryption: {},
    debug: false
}

// here 'User' is the same model class that was created above
const found = await User.find(findObj)

/**
 * above code is equivalent to:
 * 1. const found = await User.find({ }) // passing empty object as parameter
 * or
 * 2. const found = await User.find() // not passing any parameter at all
*/

```

> **Please note**: findObj is optional parameter and if: 1. no parameter is passed, or 2. an empty object as the parameter is passed, or 3. findObj with all these default values is passed, in the find method parameter, it will generate 'select all' query and retrieve all the records from the table without any filters

Each of the properties / parameters of findObj are explained below:

#### alias

**alias** is a very important parameter throughout UnSQL, it accepts string as value that is used as a local reference to the parent table name. It is context sensitive, meaning, it always refers to the immediate parent table (Here it refers to the parent model class). It automatically gets associated (unless explicitly mentioned) to all the column names in the context. This parameter plays an important role when dealing with sub-queries (via. json / array / find wrapper methods in 'select' parameter or while using 'join' association or sub-query in 'where' clause).

```javascript
const found = await User.find({ alias: 't1' })
```

#### select

**select** parameter accepts an array of various string, boolean, number, wrapper methods to dynamically generate valid SQL. A sting value that starts with a **#** is considered as a regular string, however a string that does not starts with a **#** is considered as a 'column name'. Select parameter also accepts wrapper methods (Also read [wrapper methods](#what-are-wrapper-methods-in-unsql) for more info)

```javascript
const findObj = {
        select: [
                'userId',
                { 
                str: {
                    value:'firstName',
                    textCase: 'upper',
                    as: 'fname'
                    }
                }, 
                'lastName', 
                '#this is static string and will be printed as it is',
                ]
}

const found = await User.find(findObj)
```

> **Please note:** In the above code block, `'userId'`, `'lastName'` and `'lastName'` are the column names in the database table

#### join

**join** parameter accepts an array of join objects. Each join object represents the association of child table with the immediate parent table. Join object along with its default values is explained below:

```javascript

const findObj = {
    join: [
        {
            select: undefined,
            table: 'name_of_the_associating_table',
            type: undefined,
            alias: undefined,
            join: [],
            where: {},
            junction: 'and',
            groupBy: [],
            having: [],
            using:[],
            as: undefined
        }
    ]
}

const found = await User.find(findObj)
```

Below are the explanation of each of these join parameters:

**select** (optional) accepts array of various type of values, this parameter is same as explained above (See [select parameter](#select))

**table** (required) accepts string value, refers to the name of the table in the database that is being associated here as a child

**type** (optional) defines the type of the association these two tables will have. Can have any one of the values `'left'` | `'right'` | `'inner'` | `'outer'`
- `'left'` considers all records from the parent table and only the matching column(s) record(s) from the child table
- `'right'` considers all records from the child table and only the matching column(s) record(s) from the parent table
- `'inner'` considers only the overlapping records from the two table and ignores all the other records
- `'outer'` considers only the non-matching column(s) record(s) from the two tables and ignores everything else

> **Please note:** If type is not provided, it results in a `natural` join which results in only the matching column(s) record(s) of two tables

**alias** (optional) accepts string value, provides a local reference name to the child table and is automatically associated with the column names within this (join object) context. Until **'as'** property is set, **'alias'** is also used to refer the values from the associated (child) table outside the join object. (Also see [alias](#alias) for more details on alias)

**join** (optional) accepts array of join object(s). Used for nested join association(s) (This is same as [join](#join) inside itself)

**where** (optional) accepts object value, allows to filter records in the associated child table using various conditions (Also see [where](#where) for more details on where)

**junction** (optional) accepts string value, used to define the clause that will be used to connect different conditions inside the `where` clause. Can have any one of the values `and` | `or`. Default value is `and`

**groupBy** (optional) accepts array of column name(s) that allow to group child records based on single (or list of) column(s)

**having** (optional) allows to perform comparison on the group of records, accepts array of aggregate method wrappers viz. `{sum:...}`, `{avg:...}`, `{min:...}`, `{max:...}` etc

**using** (required) accepts array of column name(s) or object(s) in the format of { parentColum: childColumn } i.e. parentColumn is the column name from the parent table and childColumn is the column name from the child (associated) table.

**as** (optional) accepts string value, provides a reference to this join object and helps refer column(s) outside this join object, such as in `select`, `where`, `having` properties of the parent table

> **Please note:** 
> 1. When using multiple join objects or when the name of the columns that connect the two tables is different it is required to use the second approach i.e. the object in th form of { parentColumn: childColumn }.
> 2. While using multiple join objects, it is recommended to set appropriate (and unique) values to the `alias` properties on both the parent as well as child tables.
> 3. It is **mandatory** to set `as` property while using `select` and (or) any other filtering properties like `where` and `having` property in case.
> 4. Whenever `as` property is set, it is used to refer any values from the child (associated) table outside the join object and `alias` property is used for internal reference of this table such as in  `select` `where` `having` properties etc within the context of join object.

#### where

**where** parameter accepts object (or nested object(s)) as its value, that helps filter records from the database based on the conditions. Each object takes in a key value pair, where key can be a string referring on of the column name, static string value or number on the other hand value can either be a string referring column name, static string value, number, array of values (each being either column name, static string and (or) number), or any of the wrapper methods (See [wrapper methods](#what-are-wrapper-methods-in-unsql))

```javascript

const findObj = {
    where: {
        or: [
            { userId: { between: { gt: 1, lt: 30 } } },
            { role: ['manager', 'admin'] }
        ],
        userStatus: 1
    }
}

const found = await User.find(findObj)
```

> **Please note:** Above is just an example referring an arbitrary *`user`* table with `'userId'`, `'role'` and `'userStatus'` as its column names

#### junction

**junction** parameter accepts one of the two string values `'and'` | `'or'`. This parameter plays an important role as it is used as a link or connect the *conditions* passed inside the `where` parameter. Default value is `'and'`

```javascript
const found = await User.find({ where:{...},  junction: 'and' })
```

> **Please note:** `junction` parameter only works with `where` and `having` parameters, and setting `junction` parameter alone will have no effect.

#### groupBy

**groupBy** parameter accepts array of column name(s). These column name(s) can either be from the parent table, associated (child) table or both. When referencing any column name from the associated (child) table(s), if the `alias` parameter is set inside the `join` object, then that column name is required to be *prefixed* with its respective `alias` value both connected using a `'.'` symbol.

```javascript
// Example 1: when grouping records using a column (here 'role') from the parent table
const result1 = await User.find({ groupBy: ['role'] })

// Example 2: When grouping records using a column (here 'city') from the associated (child) table
const result2 = await User.find({
    alias:'t1',
    join: [
        {
            alias: 't2',
            table: 'order_history',
            using: ['userId']
        }
    ]
    groupBy: ['t2.city']
    })

// Example 3: When grouping records using a column (here 'city') from the associated (child) table in a complex association
const result2 = await User.find({
    alias:'t1',
    join: [
        {
            select: ['orderId', 'userId', 'city']
            table: 'order_history',
            alias: 't2',
            using: ['userId'],
            where: {
                totalValue: { gt: 5000 }
            },
            as: 'j1'
        }
    ]
    groupBy: ['j1.city']
    })
```

> **Explanation:**
> 1. In the first example, all the user records are being grouped on the basis of their `'role'`.
> 2. In the second example, `'order_history'` table (child) is associated with the `'user'` (parent) table and the records are being grouped based on the `'city'` name from the `'order_history'` (child) table, hence the column name is being *prefixed* with the `alias` from the child table (here `'t2'` and connected using `'.'` symbol)
> 3. In the third example, similar to example 2, records are being grouped based on the `'city'` name from the child table, however, in this case, complex association is used and a local reference name (here `'j1'`) is set using the `as` parameter, hence to refer any column from this association, this local reference needs to be *prefixed* to the column name using a `'.'` symbol
> 
> **Please note:** 
> 1. In example 1, if the column belongs to the parent table, alias as *prefix* is note required as **UnSQL** will do that automatically based on the context relation.
> 2. In both the examples 2 and 3, if the column names being referenced are not ambiguous in both the tables, there is no need to *prefix* the column names with `alias` or `as` prefixes.

#### having

**having** parameter is similar to `where` parameter as it also helps filtering the records from the database table however, it is significantly different `where` it comes to the fact how it works. `having` parameter is capable of performing regular comparisons just like `where` parameter however, the major difference between that two parameters is that `having` parameter can also perform comparisons using aggregate methods such as `sum`, `avg`, `min`, `max` etc. on the 'grouped' records (using `groupBy` parameter), which is not possible with the `where` parameter.

```javascript
const result = await User.find({
    groupBy: 'salary',
    having: { 
        sum: { 
            value: 'salary',
            compare: { gt: 5000 }
         }
        }
    })
```

> **Please note:** `groupBy` parameter plays an important role when filtering records using aggregate methods to compare within `having` parameter.

#### orderBy

**orderBy** parameter is used to re-arrange the records being fetched in a specific order(s) based on the specified column name(s), it accepts object in `key: value` pair format, where in each pair the `key` represents the name of the column in the database table and the `value` is one of the two values i.e. `'asc'` (represents descending order) or `'desc'` (represents descending order)

```javascript
// Example 1:
const result1 = await User.find({
    orderBy: { firstName: 'desc' }
})

// Example 2:
const result2 = await User.find({
    orderBy: { firstName: 'asc', joiningDate: 'desc' }
})
```

> **Explanation:**
> 1. In the first example, records are being re-arranged in the descending alphabetic order based on the values of `'firstName'` column from the database table
> 2. In the second example, records are being re-arranged based on the two provided criteria: first- ascending order of their `'firstName'` column and, second- descending order of their `'joiningDate'` column

#### limit

**limit** parameter accepts number value that will 'limit' the no. of records that will be fetched from the database table, default is **undefined** hence no limit is applied and all records are fetched.

```javascript
const found = await User.find({ limit: 10 })
```

> **Please note:** Above example will limit the no. of records to '10'. **'limit'** along with **'offset'** parameter is used for pagination of records

#### offset

**offset** parameter accepts number value that will 'offset' the starting index of the records being fetched from the database table, default is **undefined** hence no offset is applied and records from the beginning are fetched

```javascript
const found = await User.find({ offset: 10 })
```

> **Please note:** Above example will offset the starting index of records to be fetched to '10'. If this index is set greater than the actual index value in the database, it will return null or empty array.

#### encryption

**encryption** parameter accepts value in `key: value` pair where each pair represents the configurations related to encryption / decryption of the column(s). These local level configuration(s) will override global level encryption configuration(s) set in the `config` property of the `model` class. These configuration(s) only effect the local level execution and does not impact any other execution(s) or invocation(s) and can vary for each execution call as desired. It can hold any one of the four configurations (or all):

```javascript
const result = await User.find({ 
    encryption: {
        mode: 'aes-256-cbc',
        secret: 'your_secret_string_goes_here'
        iv: 'Initialization Vector (required with CBC mode) goes here',
        sha: 512
    }   
    })
```

> **Please note:** All the configurations inside `encryption` parameter are optional and can be used to either set or override any (or all) of global configuration(s) for local execution

#### debug

**debug** parameter controls the debug mode for each execution, and can be set to either `'query'` | `'error'` | `true` |`false`. `debug` parameter plays an important role in understanding the SQL query that is being generated and hence understanding the operation that will be performed in this execution. Debug mode can be controlled specifically for execution, avoiding unnecessary cluttered terminal. By default, `debug` mode is in disable mode hence if no value is set for this parameter, no debugging will be performed.

|   Value   | Description |
|-----------|-------------|
| `'query'` | enables 'query' debug mode, in this mode only the dynamically generated SQL query if form of 'un-prepared statement', 'values' array to be inserted in the the 'un-prepared' statement and finally the 'prepared statement' after substituting all the 'values' from the 'values' array is displayed in the terminal as console logs |
| `'error'` | enables 'error' debug mode, in this mode only the error object, only when error is encountered, (including error message, error code, full stacktrace etc) is displayed in the terminal as console logs |
| `true`    | enables both debug modes i.e. `'query'` and `'error'`, and displays dynamically generated SQL query on each execution and also displays errors (if execution fails) in the terminal as console logs |
| `false`   | disables query mode |

> **Please note:**
> 1. Few **'warnings'** like *'version configuration mismatch'* or *'invalid value'* or *'missing required field'* errors will still be logged in the console even if the debug mode is off to facilitate faster resolving of the issue.
> 2. Irrespective of the debug mode is enabled or disabled, if the query fails, the error message / object will be available in the `'error'` parameter of the **'result'** object of the method along with the `'success'` acknowledgement keyword being set to `false`.

### What are wrapper methods in UnSQL?

## Author

- [Siddharth Tiwari](https://www.linkedin.com/in/siddharth-tiwari-2775aa97)