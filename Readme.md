# UnSQL

UnSQL is an open-source JavaScript library that provides schemaless, class based, clean and modern interface to interact with structured Database (`MySQL`), through dynamic query generation. `UnSQL` is compatible with JavaScript based runtimes like Node.js and Next.js.

## Table of Contents
1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [What's New?](#whats-new)
4. [Features](#features)
5. [Setup Guide](#setup-guide)
   - [Installation](#installation)
   - [Prerequisite](#prerequisite)
6. [Basics](#basics)
   - [How UnSQL Works?](#how-unsql-works)
   - [Model Class (Example)](#model-class-example)
   - [What is config inside model class?](#what-is-config-inside-unsql-model-class)
7. [What are the built-in methods in UnSQ?](#what-are-the-built-in-methods-in-unsql)
   - [Find method](#find-method)
   - [Save method](#save-method)
   - [Delete method](#delete-method)
   - [Export method](#export-method)
8. [Examples](#examples)
   - [How to find (read/retrieve) record(s) using UnSQL?](#how-to-find-readretrieve-records-using-unsql)
   - [How to save (insert/update/upsert) data using UnSQL?](#how-to-save-insertupdateupsert-data-using-unsql)
   - [How to delete (remove) record(s) using UnSQL?](#how-to-delete-remove-records-using-unsql)
9. [FAQs](#faqs)
   - [How to import UnSQL in model class](#how-to-import-unsql-in-model-class)
   - [How does UnSQL differentiates between column name and string value?](#how-does-unsql-differentiates-a-column-name-and-string-value)

## Overview

UnSQL simplifies working with MySQL databases by dynamically generating queries under the hood while offering developers a flexible and intuitive interface. This library eliminates boilerplate code, enhances security, and improves productivity in database management.

## Breaking Changes

Beyond **version v2.0**, backward compatibility has been dropped, from the default import, in favour of security, features and overall interface. For projects still running on version v1.x it is recommend to switch all the `import` / `require` of `'unsql'` in your existing `model` classes to legacy flag `'unsql/legacy'` as shown below:

```javascript
// v1.x import
const UnSQL = require('unsql/legacy')
// or
import UnSQL from 'unsql/legacy'

// v2.x import
const { UnSQL } = require('unsql')
// or
import { UnSQL } from 'unsql'
```

## What's New?

With the release of v2.0 `UnSQL` has been completely re-written with a even better engine and newer interface along with addition of new features like:

- **Built-in AES Encryption/Decryption modes**: Protect sensitive data natively without any third part package
- **Dynamic Query Generation**: Prevent SQL injection using placeholders
- **Multiple Debug modes**: Debug the Dynamically generated query or run Execution Benchmark
- **Built-in Error Handling**: No more try-catch, `result` holds it all
- **Revamped Interface**: Now uses object based params and properties for interaction
- **Evolved IntelliSense Support**: JSDoc-compatible type definitions provide better IDE support (Code suggestions) and type checking

## Key Features

- **Promise based** interface with streamlined async/await support
- **Schemaless** eliminates boilerplate code and hectic to manage migrations
- **Class-based Models** encapsulates configurations into clean interface
- **MySQL Support** for single `connection` and connection `pool`
- **Dynamic query generation** perform CRUDs without writing SQL
- **JSON as Response** including execution success/failure acknowledgement and `result` or `error`
- **Transaction** based executions, handles rollbacks on failure
- **Graceful Error Handling** no try-catch required, returns structured error message
- **JSDoc-compatible** for type checking and code suggestion
- **Built-in Debug Modes** (eg.: 'query', 'error', 'benchmarks' etc)
- **Built-in AES Encryption/Decryption** methods with native support for multiple modes (eg.: ECB, CBC)

## Setup Guide

### Installation

`UnSQL` can be installed into your package via. any of the package managers viz. **npm** or **yarn** as shown below:

1. Using **npm**

```bash
npm install unsql
```

Or

```bash
npm i unsql
```

Or 

2. Using **yarn**

```bash
yarn add unsql
```

### Prerequisite

UnSQL requires MySQL `connection` or connection `pool` to connect to the MySQL database. `mysql2` is the most commonly used package for this purpose

## Basics

## How UnSQL works?

`UnSQL` uses **class-based approach**, therefore first step is to create model class. Each table in your database is represented by a model class that **extends** from the `UnSQL` base class and holds *config* property specific to this model. These model classes are used to invoke various built-in methods to perform **CRUD**s.

## Model Class (Example)

Below is the example for a model class using both CommonJS and ES6 module. Here, class named `User`, extending from the `UnSQL` base class, is defined inside the `user.class.js` file. For explanation, MySQL connection `pool` is used:

**user.class.js** (CommonJS)
```javascript
// @ts-check
const { UnSQL } = require('unsql')

// get connection pool from your mysql provider service
const pool = require('path/to/your/mysql/service')

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
        table: 'test_user', // (mandatory) replace this with your table name
        pool, // replace 'pool' with 'connection' if you wish to use single connection instead of connection pool
        safeMode: true
    }

}
module.exports = { User }
```

**user.class.js** (ES6 Module)
```javascript
// @ts-check
import { UnSQL } from 'unsql'

// get connection pool from your mysql provider service
import pool from 'path/to/your/mysql/service'

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
        table: 'test_user', // (mandatory) replace this with your table name
        pool, // replace 'pool' with 'connection' if you wish to use single connection instead of connection pool
        safeMode: true
    }

}
```

## What is config inside UnSQL model class?

`config` is a _static_ object that is used to define the configurations related to that specific model class. Below are the list of properties `config` accepts:
- **table**: (mandatory) accepts name of the table in the database,
- **pool**: (optional) accepts mysql connection `pool` object,
- **connection**: (optional) accepts mysql `connection` object
- **safeMode**: accepts `boolean` value, helps avoiding accidental *delete all* due to missing `where` and (or) `having` property in `delete` method

> **Please note:** Either of the two: `pool` or `connection` property is required. `pool` takes priority over `connection` in case value for both are provided

## What are the built-in methods in UnSQL?

`UnSQL` provides five (05) *static* methods to perform the **CRUD** operations via. model class as mentioned below:

| Method   | Description                                                                           |
| -------- | ------------------------------------------------------------------------------------- |
| `find`   | fetch record(s) from the database table                                               |
| `save`   | insert / update / upsert record(s) in the database table                              |
| `delete` | remove record(s) from the database table                                              |
| `export` | export record(s) from the database table into a 'json' file                           |
| `reset`  | remove all records from database table, also reset `'auto increment'` IDs to zero (0) |

### Find method

`find` is a static, asynchronous method. It dynamically generates *select* query, that reads / retrieves record(s) from the database table. It accepts object as its parameter with various properties (optional). `find` method always returns a JSON object (Here referred as `result`) with execution success/failure acknowledgement via. `success` property (being `true` on success and `false` on failure) and `result` (Array of record(s)) or `error` (detailed error object) depending upon query was successful or not. `find` method along with all its parameters with their default values is shown below:

```javascript
const result = await User.find({
    alias: undefined,
    select: ['*'],
    join: [],
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    orderBy: {},
    limit: undefined,
    offset: undefined,
    encryption: {},
    debug: false
})

/**
 * Above code is equivalent to:
 * // 1. Passing empty object as parameter
 * const result = await User.find({ })
 * And
 * // 2. Not passing any parameter at all
 * const result = await User.find()
*/

```

Each of the aforementioned properties / parameters are explained below:

#### alias

**`alias`** is a very important parameter throughout `UnSQL`, it accepts string as value that defines local reference name of the table. It is **context sensitive**, meaning, it always refers to the immediate parent table (Here it refers to the parent model class). It automatically gets associated (unless explicitly another alias is prefixed) to all the column names in the context. This parameter plays an important role as it helps identify the columns being referred to in any property (e.g, `select` or `where` or `having` or `join` etc) when using sub-query type wrappers or `join`.

```javascript
const result = await User.find({ alias: 't1' })
```

#### select

**`select`** accepts an array of values like column name(s), string value, boolean, number, wrapper methods (See [wrapper methods](#what-are-wrapper-methods-in-unsql)). This property restricts the columns that needs to be fetched from the database table. By default, it is set to select all the columns. Below is the example of `select` property:

```javascript
const result = await User.find({
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
        '#this is string value and will be printed as it is'
    ]
})
```

> **Explanation:** In the above code block, `'userId'`, `'lastName'` and `'lastName'` are the column names in the database table, and at the end starting with `#` is a static string value

#### join

**`join`** parameter accepts an array of *join object(s)*. Each *join object* represents an association of a child `table` with the immediate parent table, on the bases of a *common column*, reference of which is provided inside `using` property. Join object along with its default values is explained below:

```javascript
const result = await User.find({
    join: [
        {
            select: ['*'],
            table: 'name_of_the_associating_table',
            type: null,
            alias: null,
            join: [],
            where: {},
            junction: 'and',
            groupBy: [],
            having: {},
            using:[],
            as: null
        }
    ]
})
```

Properties defined inside each join object are context sensitive and will work inside that scope only. Below are the explanation of each of these join properties:

`select` (optional) similar as explained above in `find` method (See [select](#select)), this property is used to restrict the columns/values that will be fetched from the associated child table.

`table` (required) accepts name of the table that is being associated as a child

type (optional) defines the type of the association these two tables will have. Can have any one of the values `'left'` | `'right'` | `'inner'`
- `'left'` considers all records from the parent table and only the matching record(s) from the child table
- `'right'` considers all records from the child table and only the matching record(s) from the parent table
- `'inner'` considers only the overlapping records from the two table and ignores all the other records

> Please note: If type is not provided, it results in a `'natural'` join which results in only the matching column(s) record(s) of two tables

`alias` (optional) similar as explained inside `find` method, this property provides local reference name to the associated (child) table. This property is *context* sensitive hence `alias` property defined inside this join object will override the default `alias` being prefixed to the column name(s) and any column name from parent table needs to be specifically prefixed with parent `alias` value (if column name(s) are ambiguous). Until `as` property is set inside join object, `alias` is also used to refer the values from the associated (child) table outside the join object. (Also see [alias](#alias) for more details on alias)

`join` (optional) accepts array of join object(s). Used for nested join association(s) (Same as [join](#join))

`where` (optional) accepts object value, allows to filter records in the associated child table using various conditions (Also see [where](#where) for more details on where)

`junction` (optional) defines the clause that will be used to connect different conditions inside the `where` | `having` property inside this join object. Similar to `junction` in `find` method (See [junction](#junction) for details), 

`groupBy` (optional) used to group records in child table (see [groupBy](#groupby) for details)

`having` (optional) allows to perform comparison on the group of records from associated (child) table (See [having](#having) for details)

`using` (required) accepts array of column name(s) or object(s) in the format of `{ parentColumn: childColumn }` here, `parentColumn` is the column name from the parent table and `childColumn` is the column name from the associated (child) table.

`as` (optional) provides a local reference name to this join object and helps refer column(s) outside this join object context, such as in `select`, `where`, `having` properties of the parent table

> **Please note:** 
> 1. When the name of the columns that connect the two tables is different or when using multiple join objects (even with same connecting column names), it is required to set the value of `using` property in the format of `{ parentColumn: childColumn }`.
> 2. While using multiple join objects, it is recommended to set appropriate (and unique) values to the `alias` property on both the parent as well as child tables.
> 3. It is **mandatory** to set `as` property while using `select` and (or) any other filtering properties viz. `where` and `having` property in case.

#### where

`where` parameter accepts object (simple or nested) as value, it is used to filter record(s) in the database based on the condition(s). Each object is in a `key: value` pair format, where `key` and `value` can be a either be a string or boolean or number or a wrapper method, on the other hand value can also accept array of values (each can be of any type: string, number, boolean or wrapper method) (see [wrapper methods](#what-are-wrapper-methods-in-unsql)). Sample where property is show below:

```javascript
const result = await User.find({
    where: {
        or: [
            { userId: { between: { gt: 1, lt: 30 } } },
            { userRole: ['#manager', '#admin'] }
        ],
        userStatus: 1
    }
})
```

> **Explanation:** In the above sample, `'userId'`, `'userRole'` and `'userStatus'` are column names, `'manager'`, `'admin'` are normal string values (starting with `#`) (See [this](#how-does-unsql-differentiates-between-a-column-name-and-string-value) for details on column name vs string value)

#### junction

`junction` can have any one of the two string values `'and'` | `'or'`. This property is used to connect the *conditions* passed inside the `where` | `having` properties. Default value is `'and'`

```javascript
const result = await User.find({ where:{...},  junction: 'and' })
```

> **Please note:** `junction` property only works with `where` and `having` parameters, and setting `junction` parameter alone will have no effect.

#### groupBy

`groupBy` property accepts array of column name(s). These column name(s) can either be from the parent table, any of the associated (child) table(s) or both. When referencing any column name from the associated (child) table(s), if the `alias` (or `as`) property is set inside the `join` object context, then that column name is required to be *prefixed* with its respective `alias` (or `as`) property value and a `'.'` symbol connecting them.

```javascript
// Example 1: when grouping records using a column (here 'role') from the parent table
const result1 = await User.find({ groupBy: ['userRole'] })

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
const result3 = await User.find({
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
> 1. In the first example, all the user records are being grouped on the basis of their `'userRole'` column.
> 2. In the second example, `'order_history'` table (child) is associated with the `'user'` (parent) table and the records are being grouped based on the `'city'` name from the `'order_history'` (child) table, hence the column name is being *prefixed* with the `alias` from the child table (here `'t2'` and connected using `'.'` symbol)
> 3. In the third example, similar to example 2, records are being grouped based on the `'city'` name from the child table, however, in this case, complex association is used and a local reference name (here `'j1'`) is set using the `as` parameter, hence to refer any column from this association, this local reference needs to be *prefixed* to the column name using a `'.'` symbol
> 
> **Please note:** 
> 1. In example 1, if the column belongs to the parent table, alias as *prefix* is note required as `UnSQL` will do that automatically based on the context relation.
> 2. In both the examples 2 and 3, if the column names being referenced are not ambiguous in both the tables, there is no need to *prefix* the column names with `alias` or `as` prefixes.

#### having

`having` property is similar to `where` property, as it also helps *filtering* the record(s) from the database table however, it is significantly different when it comes to the fact how it works. `having` property is capable of performing regular comparisons just like `where` property however, the major difference between that two properties is that `having` property can also perform comparisons using *aggregate methods* such as `sum`, `avg`, `min`, `max` etc. on the **grouped** records (using `groupBy` property), which is not possible with the `where` property. Below is an example of filtering with `having` property and `groupBy` property using `sum` aggregate (wrapper) method

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

> **Please note:** `groupBy` property plays an important role when filtering records using aggregate method(s) to compare within `having` property.

#### orderBy

`orderBy` property is used to re-arrange the records being fetched in a specific order(s) based on the specified column name(s), it accepts object in `key: value` pair format, where in each pair the `key` represents the name of the column in the database table and the `value` is one of the two values i.e. `'asc'` (ascending order) or `'desc'` (descending order)

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
> 1. In the first example, records are being re-arranged in the descending order based on the values of `'firstName'` column from the database table
> 2. In the second example, records are being re-arranged based on the two provided criteria: first- ascending order of their `'firstName'` column and, second- descending order of their `'joiningDate'` column

#### limit

`limit` as the name suggests, this property limits the no. of records that will be fetched from the database table, default is **null** hence no limit is applied and all records are fetched.

```javascript
const found = await User.find({ limit: 10 })
```

> **Explanation:** Above example will limit the no. of records to '10'. `limit` along with `offset` property is used for pagination of records

#### offset

`offset` property accepts number value that will 'offset' the starting index of the records being fetched from the database table, default is **null** hence no offset is applied and records from the beginning are fetched

```javascript
const found = await User.find({ offset: 10 })
```

> **Please note:** Above example will offset the starting index of records to be fetched to '10'. If this index is set greater than the number of records in the database, it will return null or empty array.

#### encryption

`encryption` is one of the most important properties, it is used to define Encryption/Decryption related configurations such as `mode`, `secret`, `iv` and `sha` (each as a `key: value` pair), to for specified column(s). These local level configuration(s) will override global level (if set) encryption configuration(s) set in the `config` property of the model class. These configuration(s) only effect the local level execution and does not impact any other execution(s) or invocation(s) and can vary for each execution call as desired. It can hold any one of the four configurations (or all):

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

> **Please note:** 
> 1. All the configurations inside `encryption` property are optional and can be used to either set or override any (or all) of global configuration(s) for local execution.
> 2. `iv` works only with 'cbc' mode and hence will be ignore (if set) in 'ecb' mode

#### debug

**debug** parameter controls the debug mode for each execution, and can be set to either `'query'` | `'error'` | `true` |`false`. `debug` parameter plays an important role in understanding the SQL query that is being generated and hence understanding the operation that will be performed in this execution. Debug mode can be controlled specifically for execution, avoiding unnecessary cluttered terminal. By default, `debug` mode is in disable mode hence if no value is set for this parameter, no debugging will be performed.

| Mode                | Description                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'query'`           | prints **Dynamically Generated SQL Query**: 1. **un-prepared statement**, 2. **values array** (to be inserted) and 3. **prepared statement** after substituting all the **values** |
| `'error'`           | prints only the **structured error object** (when error is encountered), includes error message, error code, full stacktrace etc                                                   |
| `'benchmark'`       | prints the **time taken to execute** the method                                                                                                                                    |
| `'benchmark-query'` | enables the combination of `'benchmark'` and `'query'` modes                                                                                                                       |
| `'benchmark-error'` | enables the combination of `'benchmark'` and `'error'` modes                                                                                                                       |
| `true`              | enables all debug modes i.e. `'query'` and `'error'` and `'benchmark'`                                                                                                             |
| `false`             | **disables all query mode**                                                                                                                                                        |

> **Please note:**
> 1. Few **'warnings'** like **'version configuration mismatch'** or **'invalid value'** or **'missing required field'** errors will still be logged in the console even if the debug mode is off to facilitate faster resolving of the issue.
> 2. Irrespective of the debug mode is *enabled* or *disabled*, if the query fails, the error message/object will be available in the `'error'` parameter of the **'result'** object of the method along with the `'success'` acknowledgement keyword being set to `false`.

### Save method

`save` is a static, asynchronous method. It dynamically generates valid SQL query, that **insert** | **update** | **upsert** data (single or in bulk) into the database table When only `data` property is set, this method **inserts** record(s), when `data` along with `where` or `having` (with `groupBy`) is set, it **updates** record(s), when `data` and `upsert` are set, it **upsert** record. `save` method takes in an object as its parameter with various properties as mentioned below:

```javascript
const result = await User.save({
    alias: null,
    data,
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    upsert: {},
    encrypt: {},
    encryption: null,
    debug: false
})
```
Below are the explanations for each of these properties:

`alias` (optional) same as in `find` method (See [alias](#alias) for details) 

```javascript
const result = await User.save({ data, alias: 'u' })
```

`data` (mandatory) is the actual data that will be **inserted** | **updated** | **upsert** into the database table. `data` can either be a single object (supports **insert**, **update** and **upsert**) or an array of objects (supports only **insert** of bulk data).

```javascript
// 1. insert single record
const result = await User.save({ 
    data: { 
        firstName: 'John', 
        userEmail: 'john.doe@example.com'
    }
 })

// 2. insert bulk records
const result = await User.save({ 
    data: [
        { 
            firstName: 'John', 
            userEmail: 'john.doe@example.com'
        },
        {
            firstName: 'Jane',
            userEmail: 'jane.doe@example.com'
        }
        ...
    ]
 })
```


`where` (optional) when condition(s) are provided, converts `save` method from **insert mode** into **update mode**. Used to identify (filter) the record(s) to be **updated** in the database table, based on the set condition(s) (See [where](#where) for more details)

```javascript
// perform update
const result = await User.save({ 
    data: {...},
    where: {
        userId: 1
    }
 })
```

`junction` (optional) accepts one of the two string values `'and'` | `'or'` (See [junction](#junction) for details)

```javascript
const result = await User.save({ 
    data: {...},
    where: {...},
    junction: 'and'
 })
```

`groupBy` (optional) used with `having` property to group records, same as explained above (See [groupBy](#groupby) for details)

```javascript
const result = await User.save({ 
    data: {...},
    groupBy: 'userRole',
    having: {...}
 })
```

`having` (optional) similar to `where` property, `having` also helps in **updating** the record(s) in the database (See [having](#having) for more details)

```javascript
const result = await User.save({ 
    data: {...},
    groupBy: 'department',
    having: {
        {
            sum: {
                value: 'salary',
                compare: {
                    gt: 50000
                }
            }
        }
    }
 })
```

`upsert` (optional) accepts single object value, when provided, switches `save` method into **upsert mode**. Value of this property is only used in a special case when `'ON DUPLICATE KEY'` error is encountered, in this case, the conflicting record is **updated** using the values provided in this property, else this property is ignored

```javascript
const result = await User.save({ 
    data: {...},
    upsert: {
        name: 'john',
        ...
    }
 })
```

`encrypt` (optional) holds information regarding the `columns` that needs to be **encrypted** and stored in the database. It accepts object in `key: value` format where each `key` represents the **column name** and `value` again is an object with three as key(s) `secret`, `iv` and `sha`

```javascript
const result = await User.save({
    data: {...},
    encrypt: {
        userEmail: {
            secret: 'someSecret',
            sha: 512
        }
    }
})
```

> **Explanation:** Above sample will encrypt `'userEmail'` column inside `data` property using the encryption configurations `secret` and `sha` provided as value object.

`encryption` (optional) holds local level configurations such as `mode`, `secret`, `iv` and `sha` that can be used for encrypting columns from the `data` property, that are specified inside the `encrypt` property (See [encryption](#encryption) for more details)

```javascript
const result = await User.save({
    data: {...},
    encrypt: {
        userEmail: {}
    },
    encryption: {
        mode: 'aes-256-cbc',
        secret: 'someSecret',
        iv: 'someInitializationVector',
        sha: 512
    }
})
```

> **Explanation:** In the above sample, encryption configurations are provided inside the `encryption` property and the value for the column name is an empty object inside `encrypt` property. Hence, the configurations from `encryption` property will be used
>
> **Please note:** If values in both properties viz. `encrypt` and `encryption` are set, `encrypt` always takes priority and will override configurations provided in `encryption` property or global encryption configurations set inside `config` property of model class

`debug` (optional) enables various 'debug' modes (See [debug](#debug) for more details)


```javascript
const result = await User.save({
    data: {...},
    debug: 'query'
})
```

### Delete method

`delete` is a static, asynchronous method that is used to dynamically generate valid SQL query that removes record(s) from the database table. `delete` method takes in an object as its parameter with various properties as mentioned below:

```javascript
const result = await User.delete({
    alias: undefined,
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    encryption: undefined,
    debug: false
})
```
Below are the explanations for each of these properties:

`alias` (optional) same as in `find` method (See [alias](#alias) for details) 

`where` (optional) is used to identify (filter) record(s) that needs to be **removed**/**deleted** from the database table (See [where](#where) for more details)

`junction` (optional) accepts one of the two string values `'and'` | `'or'` (See [junction](#junction) for details)

`groupBy` (optional) used to group records in the database table (See [groupBy](#groupby) for details)

`having` (optional) similar to `where` property `having` also helps in **filtering** the record(d) in the database that needs to be **removed**/**deleted** (See [having](#having) for more details)

`encryption` (optional) same as explained above (See [encryption](#encryption) for more details)

`debug` (optional) enables various **debug modes** (See [debug](#debug) for more details)

### Export method

`export` is a static, asynchronous method. As the name suggests, it is used to export record(s) from the database table into a dynamically generated **json file** (with same name as `table` property inside `config` property), by default inside `'exports_unsql'` directory. Record(s) can be filtered using `where` property and even columns can also be restricted using the `select` property. **This method only works when `devMode` inside `config` property is set to `true`**. This method is helpful in taking backups of the database table. `export` method takes in an object as its parameter with various properties as mentioned below:

```javascript
await User.export({
    filename: 'test_user',
    directory: 'exports_unsql',
    select: ['*'],
    where: {},
    mode: 'append',
    debug: false
})
```

Each of these properties is explained below:

`filename` (optional) used to change the default name (without file extension) of the dynamically generated file

`directory` (optional) used to change the default name of the dynamically generated directory that contains all exported `.json` files

`select` (optional) limits the columns that will be considered while exporting records, can also be used to manipulate record(s) of selected columns while exporting (see [select](#select) for details)

`where` (optional) filter record(d) that will be considered for exporting (see [where](#where) for details)

`mode` (optional) defines the behavior of export, `'append'` will recursively add data if invoked multiple times, `'override'` as the name suggests will override the dynamically generated file if invoked multiple times

`debug` (optional) enables various debug modes (see [Debug](#debug) for details)

### Reset method

`reset` is a static, asynchronous method. As the name suggests, this method resets the database table to its initial state by removing all record(s) and also setting the `auto increment` Id to zero (0). **This method only works when `devMode` is set to true and `safeMode` is set to `false`.** `export` method takes in an object as its parameter with only one (optional) property `debug` (see [debug](#debug) for details) as mentioned below:

```javascript
await User.reset({ debug: false })
```

> **Caution: This method results in a destructive change and hence should be used with caution as changes cannot be reverted back**

### What are wrapper methods in UnSQL?

`UnSQL` provides various *built-in* methods to interact with data and perform specific tasks, each of these wrapper methods belong a certain *type*. All of the wrapper methods have object like interface (`key: value` pair) to interact with them, where `key` can be any one of the specially reserved keywords that represents its respective wrapper method. Below is the list of wrapper methods along with their respective keywords available inside `UnSQL`:

| Keyword | Wrapper Type | Description                                                                               |
| :-----: | :----------: | ----------------------------------------------------------------------------------------- |
|  `str`  |    string    | performs string value related operations                                                  |
|  `num`  |   numeric    | performs numeric value related operations                                                 |
| `date`  |     date     | performs date value related operations                                                    |
|  `and`  |   junction   | performs junction override inside the `where` and `having`                                |
|  `or`   |   junction   | performs junction override inside the `where` and `having`                                |
|  `if`   | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
| `case`  | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
|  `sum`  |  aggregate   | calculates 'total' from set of values                                                     |
|  `avg`  |  aggregate   | calculates 'average' from set of values                                                   |
| `count` |  aggregate   | performs 'count' operation on set of values                                               |
|  `min`  |  aggregate   | determines 'lowest' value among the provided values                                       |
|  `max`  |  aggregate   | determines 'highest' value among the provided values                                      |
| `json`  |  sub-query   | creates a json object at the position it is invoked                                       |
| `array` |  sub-query   | creates a json array at the position it is invoked                                        |
| `refer` |  sub-query   | fetch a column from another table at the position it is invoked                           |

> **Please note:** 
> 1. *junction* type wrapper methods can only be used inside `where` and `having` property
> 2. *aggregate* type wrapper methods can only be used inside `select` and `having` property and not with `where` property
> 

All the aforementioned wrappers are explained below along with their interface:

#### String wrapper

**String wrapper** (keyword `str`) is used to perform string/text data related operations, it can be used directly/nested inside `select`, `where`, `having` properties. Below is the interface for string wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { 
            str: {
                value: 'string_value_goes_here',
                replace: {
                    target: null,
                    with: null
                }, 
                reverse: false,
                textCase: null, 
                padding: {
                    left: {
                        length: null,
                        pattern: null
                    },
                    right: {
                        length: null,
                        pattern: null
                    }
                },
                substr: {
                    start: 0,
                    length: null
                },
                trim: false,
                cast: null,
                decrypt: null,
                as: null
            }
        }
    ]
})
```

Each of these properties of **string wrapper** method are explained below:

`value` (mandatory) accepts column name or string value. All the operations are performed on this value only

`replace` (optional) accepts object with two properties `target` and `with`, both can accept either column name or string value
- `target` is used to identify the string value that needs to be replaced,
- `with` specifies the string value that will replace the `target` string

`reverse` (optional) accepts boolean value, if set to `true`, reverses the order of the characters in `value` property 

`textCase` (optional) transforms the characters of `value` property to the specified case `'upper'` | `'lower'`

`padding` (optional) accepts object with two properties `left` and `right`. Each property further accepts an object with exactly two properties `pattern` (used to fill empty spaces) and `length` (defines minimum number of characters to be maintained in the `value` property)

`substr` (optional) accepts object with two properties `start` (defines starting index) and `length` (number of characters in substring)

`trim` (optional) removes/trims whitespace in `value` property based on the value `'left'` (from the beginning) | `'right'` (from the end) | `true` (both beginning and end)

`cast` (optional) converts/casts `value` property to the specified *type* / *format* using either of the values `'char'`  | `'nchar'` | `'date'` | `'dateTime'` | `'signed'` | `'unsigned'` | `'decimal'` | `'binary'`

`decrypt` (optional) is an object with properties `secret`, `iv` (used with CBC mode) and `sha` used to decrypt `value` property. Overrides configuration(s) provided in local and global `encryption` (see [encryption](#encryption) for details)

`as` (optional) renames/provides local reference name to the `value` property

#### Numeric wrapper

**Numeric wrapper** (keyword `num`) is used to perform mathematical operations on the numeric data, it can be used / nested inside `select`, `where`, `having` clause as a `value`. All the operations are executed sequentially, in order that follows **BODMAS** rule. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { num: {
            value: 'column containing number' || number,
            decimal: null,
            mod: null,
            sub: 0,
            add: 0,
            multiplyBy: null,
            divideBy: null,
            power: null,
            cast: null,
            decrypt: null,
            as: null
            } 
        }
    ]
})
```

Each of these properties of **numeric wrapper** method are explained below:

`value` (mandatory) accepts column name or numeric value. All the operations are performed on this value only

`decimal` (optional) accepts `'floor'` | `'ceil'` | `'round'` | number as value. It determines the behavior of decimal values or limits the no. of decimal values

`mod` (optional) accepts column name or numeric value. Performs 'modulus' operation of this value on `value` property

`sub` (optional) accepts column name or numeric value. Performs 'subtraction' of this value from `value` property

`add` (optional) accepts column name or numeric value. Performs 'addition' of this value to `value` property

`multiplyBy` (optional) accepts column name or numeric value. Performs 'multiplication' of `value` property by this value

`divideBy` (optional) accepts column name or numeric value. Performs 'division' of `value` property by this value

`power` (optional) accepts column name or numeric value. Applies this value as 'power' of `value` property

`cast` (optional) used to 'convert' or 'cast' string from `value` property to the specified *type* / *format*. It accepts either of the values `'char'`  | `'nchar'` | `'date'` | `'dateTime'` | `'signed'` | `'unsigned'` | `'decimal'` | `'binary'`

`decrypt` (optional) is an object with properties `secret`, `iv` (used with CBC mode) and `sha` used to decrypt `value` property. Overrides configuration(s) provided in local and global `encryption` (see [encryption](#encryption) for details)

> **Please note:** `mode` of encryption can only be set inside the `encryption` configuration of either **findObj** or `model` class and not inside `decrypt`

`as` (optional) renames/provides local reference name to the `value` property

#### Date wrapper

**Date wrapper** (keyword `date`) is used to perform date related operations on `value` property, it can be used nested inside `select`, `where`, `having` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { date: {
            value: 'column containing date' || date,
            add: 0,
            sub: 0,
            fromPattern: null,
            cast: null,
            decrypt: null,
            format: null,
            as: null
            } 
        }
    ]
})
```

Each of these properties of **date wrapper** method are explained below:

`value` (mandatory) accepts column name or date value. All the operations are performed on this value only

`add` (optional) accepts number (representing 'days') or alpha numeric value (number along with `date` | `time` unit). Performs 'addition' of this value to `value` property

`sub` (optional) accepts number (representing 'days') or alpha numeric value (number along with `date` | `time` unit). Performs 'subtraction' of this value from `value` property

`fromPattern` (optional) accepts combination of `date` | `time` units arranged in a string pattern (see [Date Time Patterns](#date-time-patterns)), used to identify `date` | `time` element(s) in `value` property, this pattern is then used to create `'date'` | `'time'` | `'datetime'`

```javascript
const result = await User.find({
    select: [
        'userId',
        {
            date: {
                value: '#march_10th@24',
                fromPattern: '%M_%D@y',
                as: 'dateCreated'              
            }
        }
    ]
})

// output: 2024-03-10
```

`cast` (optional) used to 'convert' or 'cast' string from `value` property to the specified *type* / *format*. It accepts either of the values `'char'`  | `'nchar'` | `'date'` | `'dateTime'` | `'signed'` | `'unsigned'` | `'decimal'` | `'binary'`

`decrypt` (optional) is an object with properties `secret`, `iv` (used with CBC mode) and `sha` used to decrypt `value` property. Overrides configuration(s) provided in local and global `encryption` (see [encryption](#encryption) for details)

> **Please note:** `mode` of encryption can only be set inside the `encryption` configuration of either **findObj** or `model` class and not inside `decrypt`

`format` (optional) is used to **format** `date` in `value` property to match the desired combination of date time patterns (see [Date Time Patterns](#date-time-patterns))

```javascript
const result = await User.find({
    select: [
        'userId',
        {
            date: {
                value: 'joiningDate',
                format: '%M %D, %Y',                
            }
        }
    ]
})

// output: 'Month name' 'Day of the month (with suffix: 1st, 2nd, 3rd...)', 'Full Year (4-digits)'
```

`as` (optional) renames/provides local reference name to the `value` property

#### Date Time Patterns

Date Time Patterns can be used with `format` and `fromPattern` properties of `date` wrapper but not with `add` and `sub` property. Below mentioned *date time patterns* (in any desired combination), along with white space `' '` or allowed special characters (`'$'`, `'@'`, `'#'`, `','`, `'-'`, `'_'`, `'/'`) can be used to:
- Recognize parts of date within a regular string inside `value` property of `date` wrapper and can generate a valid date from it
- Reformat the date inside the `value` property of the `date` wrapper into any desired format

| Pattern | Description                                                                  |
| :-----: | ---------------------------------------------------------------------------- |
|  `%a`   | Abbreviated weekday name (Sun to Sat)                                        |
|  `%b`   | Abbreviated month name (Jan to Dec)                                          |
|  `%c`   | Numeric month name (0 to 12)                                                 |
|  `%D`   | Day of the month as a numeric value, followed by suffix (1st, 2nd, 3rd, ...) |
|  `%d`   | Day of the month as a numeric value (01 to 31)                               |
|  `%e`   | Day of the month as a numeric value (0 to 31)                                |
|  `%f`   | Microseconds (000000 to 999999)                                              |
|  `%H`   | Hour (00 to 23)                                                              |
|  `%h`   | Hour (00 to 12)                                                              |
|  `%I`   | Hour (00 to 12)                                                              |
|  `%i`   | Minutes (00 to 59)                                                           |
|  `%j`   | Day of the year (001 to 366)                                                 |
|  `%k`   | Hour (0 to 23)                                                               |
|  `%l`   | Hour (1 to 12)                                                               |
|  `%M`   | Month name in full (January to December)                                     |
|  `%m`   | Month name as a numeric value (00 to 12)                                     |
|  `%p`   | AM or PM                                                                     |
|  `%r`   | Time in 12 hour AM or PM format (hh:mm:ss AM/PM)                             |
|  `%S`   | Seconds (00 to 59)                                                           |
|  `%s`   | Seconds (00 to 59)                                                           |
|  `%T`   | Time in 24 hour format (hh:mm:ss)                                            |
|  `%U`   | Week where Sunday is the 1st day of the week (00 to 53)                      |
|  `%u`   | Week where Monday is the 1st day of the week (00 to 53)                      |
|  `%V`   | Week where Sunday is the 1st day of the week (01 to 53). Used with `%X`      |
|  `%v`   | Week where Monday is the 1st day of the week (01 to 53). Used with `%x`      |
|  `%W`   | Weekday name in full (Sunday to Saturday)                                    |
|  `%w`   | Day of the week where Sunday=0 and Saturday=6                                |
|  `%X`   | Year for the week (Sunday being 1st day of the week). Used with `%V`         |
|  `%x`   | Year for the week (Monday being 1st day of the week). Used with `%v`         |
|  `%Y`   | Year (4-digit)                                                               |
|  `%y`   | Year (2-digit)                                                               |

#### Date Time Units

Below **date time units** are only usable with `add` and `sub` property of `date` wrapper method and not with `format` and `fromPattern` property

| keyword | unit               |
| :-----: | ------------------ |
|   `f`   | MICROSECOND        |
|   `s`   | SECOND             |
|   `i`   | MINUTE             |
|   `h`   | HOUR               |
|   `d`   | DAY                |
|   `w`   | WEEK               |
|   `m`   | MONTH              |
|   `q`   | QUARTER            |
|   `y`   | YEAR               |
|  `smi`  | SECOND_MICROSECOND |
|  `mmi`  | MINUTE_MICROSECOND |
|  `ms`   | MINUTE_SECOND      |
|  `hmi`  | HOUR_MICROSECOND   |
|  `hs`   | HOUR_SECOND        |
|  `hm`   | HOUR_MINUTE        |
|  `dmi`  | DAY_MICROSECOND    |
|  `ds`   | DAY_SECOND         |
|  `dm`   | DAY_MINUTE         |
|  `dh`   | DAY_HOUR           |
|  `yM`   | YEAR_MONTH         |

#### And / Or wrapper

**and* wrapper** (keyword `and`) | **or wrapper** (keyword `or`) both are similar in interface as both accepts array of objects. The only difference in the two is that **and** wrapper joins each immediate child condition using 'and' clause (junction) whereas, **or** wrapper joins each immediate child condition using 'or' clause (junction). Both can be used / nested inside `where` and `having` properties only and not (directly) in `select` property

```javascript
const result = await User.find({
    where: { 
        and: [
            { userId: 55 },
            { department: 'sales' }
        ],
        or: [
            { userStatus: 0 },
            { userStatus: 2 },
        ]
     }
})
```

> **Explanation:**
> In the above sample, `'userId'`, `'department'` and `'userStatus'` represents columns in `user` table. Here, 'conditions' to check `'userId'` and `'department'` (inside `and` array) will be using **'and'** clause whereas, the two 'conditions' to check `'userStatus'` (inside `or` array) will be connected using **'or'** clause
> **Please note:** 
> 1. `and` | `or` wrappers directly cannot be used inside `select` property however, they can be used in-directly withing `json` | `array` | `refer` wrappers
> 2. Since, `junction` is not provided hence conditions inside `and` and `or` clause will be using the default value `'and'` to connect with each other
> 3. `and` and `or` clause can also be nested in any fashion as desired

#### If wrapper

**If wrapper** (keyword `if`) has a `check` property that accepts a conditional object to compare two values and returns either `true` or `false`. If the `check` property returns `true`, the value in `trueValue` property is returned by this wrapper, if `check` is `false` then the value in `falseValue` property is returned. `as` *(optional)* is used to provide a local reference name to the value returned by `if` wrapper method. Below is the interface for the `if` wrapper:

```javascript
const result = await User.find({
    select: [
        { 
            if: {
                check: {},
                trueValue: null,
                falseValue: null,
                as: null
            }
        }
    ]
})
```

#### Case wrapper

**Case wrapper** (keyword `case`) is similar to `if` wrapper as it is also used to check the conditions provided inside `check` property and return respective value. However, a major difference here is that `if` wrapper is used to check **'single condition'** whereas `case` wrapper is used when you have **'multiple condition'** and corresponding value pairs. `check` property accepts an array of object(s), each object consists of exactly two `key: value` pairs, where `key` is `when` property that accepts object to check the condition and `then` property that holds the respective value (for each `when` property) to be returned when the condition is `true`. Below is the interface for the `if` wrapper:

```javascript
const result = await User.find({
    select: [
        { 
            case: {
                check: [{ when: {}, then: null }],
                else: null,
                as: null
            }
        }
    ]
})
```

#### Sum wrapper

**Sum wrapper** (keyword `sum`) is used to calculate 'sum' of a set (group) of records. This is and aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
{
    sum: {
        value:'',
        cast: null,
        compare: {},
        as: null
    }
}
const result = await User.find({
    select: [
        { sum: {
            value: 'salary',
            cast: 'signed',
            as: 'totalSalary'
            }
        }
    ],
    groupBy: ['department'],
    having: {
        sum: { 
            value: 'salary',
            compare: {
                gt: 5000
            }
         }
    }
})
```

> **Explanation:**
> In the above sample, `'salary'` and `'department'` represents columns in `user` table. Here, inside `select` property, we are calculating sum of salaries, since we have used `groupBy` to group records using `'department'`, sum of salaries from each `'department'` will be calculated are returned with the local reference name `'totalSalary'`, then we are filtering to fetch all records only when 'totalSalary' is greater than 5000
> **Please note:** 
> 1. `cast` is used for type casting of `value` property into desired type
> 2. `compare` property is available when `sum` is used inside `having` and not available when it is being used inside `select` clause
> 3. `as` property is available when this wrapper is used inside `select` and not available when it is being used inside `having` clause
> 4. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Average wrapper

**Average wrapper** (keyword `avg`) is used to calculate 'average' of a set (group) of records. This is and aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { avg: {
            value: 'salary',
            cast: 'unsigned',
            as: 'averageSalary'
            }
        }
    ],
    groupBy: ['department'],
    having: {
        avg: { 
            value: 'salary',
            compare: {
                gt: 5000
            }
         }
    }
})
```

> **Explanation:**
> In the above sample, `'salary'` and `'department'` represents columns in `user` table. Here, inside `select` property, we are calculating *average* of salaries, since we have used `groupBy` to group records using `'department'`, average of salaries from each `'department'` will be calculated are returned with the local reference name `'averageSalary'`, then we are filtering to fetch all records only when 'averageSalary' is greater than 5000
> **Please note:** 
> 1. `compare` property is available when this wrapper is used inside `having` and not available when it is being used inside `select` clause
> 2. `as` property is available when this wrapper is used inside `select` and not available when it is being used inside `having` clause
> 3. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Minimum wrapper

**Minimum wrapper** (keyword `min`) is used to calculate 'minimum' among a set (group) of records. This is and aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { min: {
            value: 'salary'
            cast: 'unsigned',
            as: 'minSalary'
            }
        }
    ],
    groupBy: ['department'],
    having: {
        min: { 
            value: 'salary',
            compare: {
                gt: 5000
            }
         }
    }
})
```

> **Explanation:**
> In the above sample, `'salary'` and `'department'` represents columns in `user` table. Here, inside `select` property, we are calculating minimum of salaries, since we have used `groupBy` to group records using `'department'`, minimum salaries from each `'department'` will be calculated are returned with the local reference name `'minSalary'`, then we are filtering to fetch all records only when 'minSalary' is greater than 5000
> **Please note:** 
> 1. `compare` property is available when this wrapper is used inside `having` and not available when it is being used inside `select` clause
> 2. `as` property is available when this wrapper is used inside `select` and not available when it is being used inside `having` clause
> 3. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Maximum wrapper

**Maximum wrapper** (keyword `max`) is used to calculate 'maximum' among a set (group) of records. This is and aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    select: [
        { max: {
            value: 'salary'
            cast: 'unsigned',
            as: 'maxSalary'
            }
        }
    ],
    groupBy: ['department'],
    having: {
        max: { 
            value: 'salary',
            compare: {
                gt: 5000
            }
         }
    }
})
```

> **Explanation:**
> In the above sample, `'salary'` and `'department'` represents columns in `user` table. Here, inside `select` property, we are calculating maximum of salaries, since we have used `groupBy` to group records using `'department'`, maximum salaries from each `'department'` will be calculated are returned with the local reference name `'maxSalary'`, then we are filtering to fetch all records only when 'maxSalary' is greater than 5000
> **Please note:** 
> 1. `compare` property is available when this wrapper is used inside `having` and not available when it is being used inside `select` clause
> 2. `as` property is available when this wrapper is used inside `select` and not available when it is being used inside `having` clause
> 3. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Json wrapper

**Json wrapper** (keyword `json`) is used to create 'json object' either directly or from another table (via. 'sub-query') by providing in `key: value` pair(s) to `value` property. It can be used / nested only inside `select` and `where` parameters as a `value`. Here `key` is always a string value and `value` can be anything from string value to a number or even a nested object. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    alias: 'u',
    select: [
        {
            json: {
                value: {},
                table: null,
                alias: null,
                where: {}
                as: 'json'
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an object `key: value` pair(s) as value. `key` being a string value, `value` can be either string value or a column or any of the UnSQL reserved constants (see [reserved constants](#what-are-unsql-reserved-constants)) or number or nested object

`table` (optional) reference to the child table from which the columns needs to be fetched

`alias` (optional) provides local reference to the child table, see [alias](#alias) for details

`where` (optional) used to filter records, see [where](#where) for details

`as` (optional) is used to rename the json object name, if not provided defaults to 'json'


> **Please note:** 
> 1. Using alias is always a good practice but, if the column names inside the two referenced tables are not ambiguous then alias can be excluded
> 2. `as` property is available when this wrapper is used inside `having` and not available when it is being used inside `select` clause
> 3. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Array wrapper

**Array wrapper** (keyword `array`) is used to create 'json array' of values (string, number, json object) either directly or from another table (via. 'sub-query') by providing in. It can be used / nested only inside `select` clause as a `value`. This wrapper method is almost similar to `json` wrapper, only difference is that `json` is useful if only 1 object is required however, `array` wrapper is helpful when there are multiple child records that are required to be patched in a one-to-many relation. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    alias: 'u',
    select: [
        {
            array: {
                value: [] || {},
                table: null,
                alias:
                where: {}
                as: 'array'
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an array of values or an object in `key: value` pair format as value. `key` being a string , `value` can be either string value or a column name or number or nested object

`table` (optional) reference to the child table from which the columns needs to be fetched

`alias` (optional) provides local reference to the child table, see [alias](#alias) for details

`where` (optional) used to filter records, see [where](#where) for details

`as` (optional) is used to rename the json array name, if not provided defaults to 'array'


> **Please note:** 
> 1. Using alias is always a good practice but, if the column names inside the two referenced tables are not ambiguous then alias can be excluded

#### Refer wrapper

**Refer wrapper** (keyword `refer`) is used to run 'sub-query' to fetch 'single' field from any specific record from another `table`. It can be used / nested only inside `select`, `where` and `having` clause as a `value`. This method is helpful to fetch 1 record in a one-to-one relation. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const result = await User.find({
    alias: 'u',
    select: [
        {
            refer: {
                select: ['*'],
                table: 'table_name',
                where: null, 
                groupBy = [], 
                having = [], 
                orderBy = {}, 
                limit = null, 
                offset = null,
                as: null
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an array of values or an object in `key: value` pair format as value. `key` being a string value, `value` can be either string value or a column name or number or nested object

`table` reference to the child table from which the columns needs to be fetched

`alias` (optional) provides local reference to the child table, see [alias](#alias) for details

`where` (optional) used to filter records, see [where](#where) for details

`groupBy` (optional) used to group records, see [groupBy](#groupby) for details

`having` (optional) used to filter records with aggregate wrapper methods support, see [having](#having) for details

`orderBy` (optional) used to re-order records, see [orderBy](#orderby) for details

`limit` (optional) used to limit no. of records, see [limit](#limit) for details

`offset` (optional) used to change the starting index for the records to be fetched from, see [offset](#offset) for details

`as` (optional) is used to rename the json array name, if not provided defaults to 'array'

> **Please note:** This wrapper method is very important as it similar to actual `find` method inside `UnSQL`

### What are comparators in UnSQL?

**comparator** as the name suggests are used to compare two values. They have a layer of nested object `key: { comparator: value }` pair format like interface where the `key` is compared with the `value` based on the `comparator` used. `key` and `value` can be either string value or column name or number or boolean or any of the built-in wrapper methods. `UnSQL` provides various types of `comparator` as mentioned below:

| comparator     | expression       | description                                                                            |
| -------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `eq`           | `=`              | compares if `key` **is equal** to `value`                                              |
| `notEq`        | `!=`             | compares if `key` **is not equal** to `value`                                          |
| `gt`           | `>`              | compares if `key` **is greater than** to `value`                                       |
| `lt`           | `<`              | compares if `key` **is lower than** to `value`                                         |
| `gtEq`         | `>=`             | compares if `key` **is greater than** to `value`                                       |
| `ltEq`         | `<=`             | compares if `key` **is lower than** to `value`                                         |
| `isNull`       | `IS NULL`        | checks if `key` **is null**                                                            |
| `in`           | `IN`             | checks if `key` has an **exact match** in the provided set of values in `value`        |
| `notIn`        | `NOT IN`         | checks if `key` **does not have exact match** in the provided set of values in `value` |
| `like`         | `LIKE '%?%'`     | performs a **fuzzy search** if `value` **contains** `key` **at any position**          |
| `notLike`      | `NOT LIKE '%?%'` | performs a **fuzzy search** if `value` **does not contain** `key` **at any position**  |
| `startLike`    | `LIKE '?%'`      | performs a **fuzzy search** if `value` **begins with** `key`                           |
| `notStartLike` | `NOT LIKE '?%'`  | performs a **fuzzy search** if `value` **does not begins with** `key`                  |
| `endLike`      | `LIKE '%?'`      | performs a **fuzzy search** if `value` **ends with** `key`                             |
| `notEndLike`   | `NOT LIKE '%?'`  | performs a **fuzzy search** if `value` **does not ends with** `key`                    |

## Examples

### How to find (read/retrieve) record(s) using UnSQL?

#### Read all records:

```javascript
router.get('/users/:userId(\\d+)', async (req, res)=> {
    const result = await User.find()

    // above code is similar to
    // const result = await User.find({ })

})
```

#### Fetch single user by userId:

```javascript
router.get('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const result = await User.find({
        where: { userId }
    })

    // above code is similar/shorthand for:
    
    // 1. 
    // const result = await User.find({
    //     where: { userId: userId }
    // })

    // 2.
    // const result = await User.find({
    //     where: { userId: { eq: userId } }
    // })
})
```

#### Login example:

```javascript
router.post('/users/login', async (req, res)=> {

    const { loginId, password } = req.body

    const result = await User.find({
        select: [ 'userId', 'userEmail', 'firstName', 'lastName', 'userPassword' ],
        where: {
            or: [
                { userEmail: `#${loginId}` },
                { userMob: `#${loginId}` }
            ]
        }
    })

    // rest of the authentication logic goes here...

})
```

#### Login example (user email was encrypted using AES-256-CBC encryption in the database):

```javascript
router.post('/users/login', async (req, res)=> {

    const { loginId, password } = req.body

    const result = await User.find({
        select: [ 'userId', 'userEmail', 'firstName', 'lastName', 'userPassword' ],
        where: {
            or: [
                { str: { 
                    value: 'userEmail',
                    decrypt: {
                        secret: '#your_secret',
                        iv: '#your_initialization_vector'
                    }
                    compare: { eq: `#${loginId}` },
                    },
                },
                { userMob: `#${loginId}` }
            ]
        },
        encryption: {
            mode: 'aes-256-cbc'
        }
    })

    // rest of the authentication logic goes here...

})
```

> **Explanation:** Here, `'userId'`, `'userEmail'`, `'firstName'`, `'lastName'`, `'userPassword'` are the column in the database table. `str` wrapper is used to **Decrypt** `'userEmail'` column using the `secret` and `iv` properties. **Encryption mode** is set to `'aes-256-cbc'` inside `encryption` property. After Decrypting `'userEmail'`, its value is then compared with the `loginId` received in the **request body**. Since `secret` `iv` and `loginId` are regular strings and not column names hence, they are prefixed with `#`.

### How to save (insert/update/upsert) data using UnSQL?

#### insert data

```javascript
router.post('/users', async (req, res)=> {

    const { data } = req.body

    const result = await User.save({ data })

    // above code is similar/shorthand for:
    
    // const payload = req.body
    // const result = await User.find({ data: payload })

})
```

#### update data

```javascript
router.put('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const { data } = req.body

    const result = await User.save({
        data,
        where: { userId }
    })

})
```

### How to delete (remove) record(s) using UnSQL?

#### delete specific record

```javascript
router.delete('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const result = await User.delete({
        where: { userId }
    })

})
```
#### delete multiple record(s)

```javascript
router.delete('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const result = await User.delete({
        where: { 
            department: ['#salesInterns', '#marketingInterns'],
            {
                date: {
                    value: 'joiningDate',
                    format: '',
                    compare: {
                        eq: {
                            date: {
                                value: 'currentDate',

                            }
                        }
                    }
                }
            }
        }
    })

})
```

## FAQs

### How to import UnSQL in model class?

`UnSQL` can be imported using any of the following:

1. CommonJS import
```javascript
const UnSQL = require('unsql')
```

2. ES6 Module import
```javascript
import UnSQL from 'unsql'
```

### How does UnSQL differentiates between a column name and string value?

Any string value that **starts with a** `#` is considered as a **string value** and any other string that **does not start with** `#` is considered as a **column name**. This `#` is ignored while utilizing the actual string value. If your string value is some sort of code or any value that also has a **#** at the beginning then also an additional `#` as prefix is required else the **#** in your value will be ignored (e.g. `'#someCode'` is required to be written as `'##someCode'`)

```javascript
const result = await User.find({
    select: ['userId', 'firstName', 'lastName', '#test']
    where: {
        firstName: '#Siddharth'
    }
})
```
> **Explanation:** In the above example, `'userId'`, `'firstName'` and `'lastName'` are the column names hence does not start with `#` on the other hand `'test'` and `'Siddharth'` are the string values hence contains `#` as prefix to differentiate them with column names.

### What are UnSQL Reserved Constants?

`UnSQL` has various **built-in reserved constants** as mentioned below:

| constant           | description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `currentDate`      | represents reference of current date and time                       |
| `now`              | same as `currentDate` represents reference of current date and time |
| `currentTime`      | same as `currentDate` represents reference of current date and time |
| `currentTimestamp` | same as `currentDate` represents reference of current date and time |
| `localTime`        | same as `currentDate` represents reference of current date and time |
| `localTimestamp`   | same as `currentDate` represents reference of current date and time |
| `pi`               | same as `currentDate` represents reference of current date and time |

## Author

- [Siddharth Tiwari](https://www.linkedin.com/in/siddharth-tiwari-2775aa97)