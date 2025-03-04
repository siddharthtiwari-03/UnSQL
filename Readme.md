# UnSQL
![NPM Version](https://img.shields.io/npm/v/unsql "production (stable)")
[![GitHub package.json version](https://img.shields.io/github/package-json/v/siddharthtiwari-03/unsql "latest (unstable)")](https://www.github.com/siddharthtiwari-03/unsql)
[![GitHub Release](https://img.shields.io/github/v/release/siddharthtiwari-03/unsql?include_prereleases "latest (release)")](https://github.com/siddharthtiwari-03/UnSQL/releases)
![NPM Downloads](https://img.shields.io/npm/dm/unsql)
![NPM License](https://img.shields.io/npm/l/unsql "UnSQL License")


**UnSQL** is an open-source, lightweight JavaScript library that provides schemaless, class based, clean and modern interface to interact with structured Database (`mysql`/`postgresql`/`sqlite`), through dynamic query generation. `UnSQL` is compatible with JavaScript based runtimes like Node.js and Next.js.

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
7. [What are the built-in methods in UnSQL?](#what-are-the-built-in-methods-in-unsql)
   - [Find method](#find-method)
   - [Save method](#save-method)
   - [Delete method](#delete-method)
   - [Raw Query method](#raw-query-method)
   - [Export method](#export-method)
   - [Reset method](#reset-method)
8. [What is Session Manager in UnSQL?](#what-is-session-manager-in-unsql)
9. [Examples](#examples)
   - [How to find (read/retrieve) record(s) using UnSQL?](#how-to-find-readretrieve-records-using-unsql)
   - [How to save (insert/update/upsert) data using UnSQL?](#how-to-save-insertupdateupsert-data-using-unsql)
   - [How to delete (remove) record(s) using UnSQL?](#how-to-delete-remove-records-using-unsql)
   - [How to use Session Manager?](#how-to-use-session-manager)
10. [FAQs](#faqs)
    - [How to import UnSQL in model class](#how-to-import-unsql-in-model-class)
    - [How does UnSQL differentiates between column name and string value?](#how-does-unsql-differentiates-a-column-name-and-string-value)
    - [What are Reserved Constants in UnSQL?](#what-are-reserved-constants-in-unsql)
    - [Does UnSQL support SQL Json Datatype](#does-unsql-support-mysql-json-datatype)
    - [How Encryption/Decryption works in UnSQL?](#how-does-encryptiondecryption-works-in-unsql)

## Overview

**UnSQL** simplifies working with structured (SQL) databases by dynamically generating queries under the hood while offering developers a flexible and intuitive interface. It eliminates boilerplate code, enhances security, and improves productivity in database management.

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

> **Please note:** [**Documentation for version v1.x**](https://github.com/siddharthtiwari-03/UnSQL/tree/legacy "Open v1.x documentation") is available on **GitHub**

## What's New?

With the release of: 

### version v2.0.4:

- **Minor Bug fixes** code is more stable than before
- **Performance enhancement** query generation is now faster and more efficient

> For full **release notes** please visit [this](https://github.com/siddharthtiwari-03/UnSQL/releases "UnSQL release notes")

## Key Features

- **Promise based** interface with streamlined async/await support
- **Schemaless** eliminates boilerplate code and hectic to manage migrations
- **Class-based Models** encapsulates configurations into clean interface
- **Support connection** `pool` reuses connections
- **Dynamic query generation** perform CRUDs without writing SQL
- **JSON as Response** including execution success/failure acknowledgement and `result` or `error`
- **Transaction** based executions, handles rollbacks on failure
- **Graceful Error Handling** no try-catch required, returns structured error message
- **JSDoc-compatible** for type checking and code suggestion
- **Built-in Debug Modes** (eg.: 'query', 'error', 'benchmarks' etc)
- **Built-in AES Encryption/Decryption** protect sensitive data natively without any third part package

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

1. **MySQL:** `dialect: 'mysql'` (default)

MySQL `connection` or connection `pool` (recommended) is required to connect to the MySQL database. `mysql2` is the most commonly used package for this purpose. Make sure to **add** `multipleStatements: true` into your `mysql2` `createPool` or `createConnection` method as shown below:

```javascript
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
    ...
    namedPlaceholders: true, // (optional) required if using rawQuery with named placeholders
    multipleStatements: true // (optional) required if using Encryption/Decryption features
})
```

2. **PostgreSQL:** `dialect: 'postgresql'`

With version v2.1.0, support for **postgresql** has been added. `pg` is the most commonly used package to create connection `pool` for **postgresql** databases. Your `db.service.js` file should look like: 

```javascript
import { Pool } from 'pg'

export const pool = new Pool({...})
```

3. **SQLite:** `dialect: 'sqlite'`

With version v2.1.0, support for **SQLite** has been added. `sqlite` and `sqlite3` are required packages for establishing *connection*. Your `db.service.js` file should look like:

```javascript
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./databases/test.db', err => {
    if (err) console.error('error while opening database', err)
})

module.exports = { db }
```

> **Please note:** 
> 1. These libraries are required to establish a *connection* with the respected database(s). Configuration inside `db.service.js` for each `dialect` is different (as aforementioned)
> 2. Common configurations like `host`, `user`, `password`, `database`, `port` are not mentioned above but required by them
> 3. Although, `sqlite` does not support **connection pool**, the connection `db` established here is used inside `pool` property of `config`
> 4. `'./databases/test.db'` directory mentioned is just a sample name and no directory will be created automatically

## Basics

## How UnSQL works?

`UnSQL` uses **class-based approach**, therefore first step is to create model class. Each table in your database is represented by a model class that **extends** from the `UnSQL` base class and holds *config* property specific to this model. These model classes are used to invoke various built-in methods to perform **CRUD**s.

## Model Class (Example)

Below is the example for a model class using both CommonJS and ES6 module. Here, class named `User`, extending from the `UnSQL` base class, is defined inside the `user.class.js` file. For explanation, MySQL connection `pool` is used:

**user.class.js** (CommonJS)
```javascript
// @ts-check
const { UnSQL } = require('unsql')

// get connection pool from your db provider service
const pool = require('path/to/your/db/service')

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
        pool, // provide 'db' instance here in 'sqlite' mode
        safeMode: true,
        devMode: false,
        dialect: 'mysql' // (default) or 'postgresql' or 'sqlite'
    }

}
module.exports = { User }
```

**user.class.js** (ES6 Module)
```javascript
// @ts-check
import { UnSQL } from 'unsql'

// get connection pool from your db provider service
import { pool } from 'path/to/your/db/service'

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
        pool, // provide 'db' instance here in 'sqlite' mode
        safeMode: true,
        devMode: false,
        dialect: 'mysql' // (default) or 'postgresql' or 'sqlite'
    }

}
```

## What is config inside UnSQL model class?

`config` is a *static* object that is used to define **global level configurations** that are specific for all references of this model class. Below are the list of properties `config` accepts:
- **table**: (mandatory) accepts name of the table in the database,
- **pool**: (optional) accepts sql connection `pool` (or `sqlite` `db` connection) object,
- **connection**: (optional) accepts mysql `connection` object,
- **safeMode**: accepts `boolean` value, helps avoiding accidental *delete all* due to missing `where` and (or) `having` property in `delete` method,
- **devMode**: accepts `boolean` value, Enables/Disables features like **Export to/Import from another model**, **reset** database table mapped to model
- **dialect**: defines sql type viz. `'mysql'`, `'postgresql'` or `'sqlite'` (defaults to `'mysql'`)

> **Please note:** Either of the two: `pool` or `connection` property is required. `pool` takes priority over `connection` in case value for both are provided

## What are the built-in methods in UnSQL?

`UnSQL` provides six (06) *static* methods to perform the **CRUD** operations via. model class as mentioned below:

| Method                          | Description                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [`find`](#find-method)          | fetch record(s) from the database table                                                                                           |
| [`save`](#save-method)          | insert / update / upsert record(s) in the database table                                                                          |
| [`delete`](#delete-method)      | remove record(s) from the database table                                                                                          |
| [`rawQuery`](#raw-query-method) | enables execution of raw queries, supports manually created placeholders                                                          |
| [`export`](#export-method)      | export record(s) to a dynamically generated '.json' file or migrate data into another table mapped to a valid `UnSQL` model class |
| [`reset`](#reset-method)        | remove all records from database table (resets `'auto increment'` IDs to zero (0))                                                |

### Find method

`find` is a static, asynchronous method, that dynamically generates *select query*, to read/retrieve record(s) from the mapped database table. It accepts object (optional) as its parameter with various properties (optional). `find` method always returns a JSON object with execution success/failure acknowledgement via. `success` property (being `true` on success and `false` on failure) and `result` (Array of record(s)) or `error` (detailed error object) depending upon query was successful or not. `find` method combines `findAll` and `findOne` into one single method, as `findOne` method (in every other library/ORM) is just a wrapper around `findAll` and grabs the first matching record. `find` method along with all its parameters with their default values is shown below:

```javascript
const response = await User.find({
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
    debug: false,
    session: undefined
})

/*
 Above code is equivalent to:
 // 1. Passing empty object as parameter
 const response = await User.find({ })
 And
 // 2. Not passing any parameter at all
 const response = await User.find()
*/

/* 
1. When successful
response = {
    success: true,
    result: [...] or [] (when no data found),
}

2. When error is encountered
response = {
    success: false,
    error: ErrorObject (containing error code, message, sql, trace)
}
*/
```

Each of the aforementioned properties / parameters are explained below: [selector](#selector)

#### alias

`alias` is an important parameter throughout `UnSQL`, it accepts string as value that defines local reference name of the table. It is **context sensitive**, meaning, it always refers to the immediate parent table (Here it refers to the parent model class). This parameter plays an important role as it helps identify the columns being referred to in any property (e.g, `select` or `where` or `having` or `join` etc) when using sub-query type wrappers or `join`.

```javascript
const response = await User.find({ alias: 't1' })
```

#### select

`select` accepts an array of values like column name(s), string value, boolean, number, wrapper methods (See [wrapper methods](#what-are-wrapper-methods-in-unsql)). This property restricts the columns that needs to be fetched from the database table. By default, it is set to select all the columns. Below is a sample of `select` property:

```javascript
const response = await User.find({
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

> **Explanation:** In the above sample block, `'userId'`, `'lastName'` and `'lastName'` are the column names in the database table, and at the end starting with `#` is a static string value

#### join

`join` parameter accepts an array of *join object(s)*. Each *join object* represents an association of a child `table` with the immediate parent table, on the bases of a *common column*, reference of which is provided inside `using` property. Join object along with its default values is explained below:

```javascript
const response = await User.find({
    join: [
        {
            select: ['*'],
            table: 'some_table',
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

`type` (optional) defines the type of the association these two tables will have. Can have any one of the values `'left'` | `'right'` | `'inner'`
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
const response = await User.find({
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
const response = await User.find({ where:{...},  junction: 'and' })
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
const response = await User.find({
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

`encryption` is one of the most important properties, it is used to define **Encryption/Decryption** related configurations such as `mode`, `secret`, `iv` and `sha`. These *local* configuration(s) will override *global* `encryption` property (see [global config](#what-is-config-inside-unsql-model-class)). These configurations are restricted to execution context and can be redefined for each execution as desired. It can hold any one of the four configurations (or all):

```javascript
const response = await User.find({ 
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
> 3. **When setting encryption `mode`, it is required to set `multipleStatements: true` inside your `createConnection` or `createPool` configuration.**

#### debug

**debug** property controls the debug mode for each execution, and can be set to either `'query'` | `'error'` | `true` | `false`  | `'benchmark'` | `'benchmark-query'` | `'benchmark-error'`. `debug` property plays an important role in understanding the SQL query that is being generated and hence understanding the operation that will be performed in this execution. Debug mode can be controlled specifically for execution, avoiding unnecessary cluttered terminal. By default, `debug` mode is in disable mode hence if no value is set for this property, no debugging will be performed.

#### session

**session** (provided by `SessionManager`) enables `UnSQL` to chain multiple query executions and **re-use one transaction** across these queries and **rollback** (in case of error) or **commit** all changes at once using this **session/transaction**

```javascript
import { SessionManager } from 'unsql'
import { pool } from '.path/to/your/db/service/'

router.post('/', async (req, res) => {

    const { userInfo, addressInfo } = req.body

    // Create session from Session Manager
    const session = new SessionManager(pool)

    // invoke transaction by calling transaction lifecycle method provided by session
    await session.init()
    
    // your code goes here...
    const userResponse = await User.save({ data: userInfo, session }) // pass session inside query to chain this query

    addressInfo.userId = userResponse.insertId // patch auto generated 'userId' to addressInfo

    const addressResponse = await Address.save({ data: addressInfo, session }) // pass session inside query to chain this query

    //  handle if error is encountered
    if(!userInfo.success || !addressInfo.success) {
        // rollback all prior changes if error is encountered
        await session.rollback()
        return
    }

    // finally commit all changes if no errors encountered
    await session.commit()
})
```
> **Please note:**
> 1. SessionManager takes in another optional parameter viz. `'mysql'` (default), `'postgresql'` or `'sqlite'`
> 2. Passing `false` as parameter for `rollback` and `commit` methods will allow you to perform their respective actions (at multiple locations) **without closing** the `transaction` and destroying the session
> 3. `rollback` and `commit` can be called at any position and it will either **rollback/commit** all proceeding changes till that position


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
const response = await User.save({
    alias: undefined,
    data,
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    upsert: {},
    encrypt: {},
    encryption: {},
    debug: false,
    session: undefined
})


/* When successful
1. MySQL returns
response = {
    success: true,
    result: {
        "fieldCount": 0,
        "affectedRows": 1, // number of records inserted/updated
        "insertId": 1,  // dynamically generated primary key (only auto_increment id) of the first record inserted in this query, else zero '0'
        "info": "",
        "serverStatus": 2,
        "warningStatus": 0,
        "changedRows": 0
    }
}
2. PostgreSQL returns
response = {
    "success": true,
    "result": [{...}] // record (with primary key ID) that was recently added
}
3. Sqlite returns
response = {
    success: true,
    insertId: 1, // in case of 'save', last 'inserted' ID
    changes: 1 // in case of 'update'
}
*/
```
Below are the explanations for each of these properties:

`alias` (optional) same as in `find` method (See [alias](#alias) for details) 

```javascript
const response = await User.save({ data, alias: 'u' })
```

`data` (mandatory) is the actual data that will be **inserted** | **updated** | **upsert** into the database table. `data` can either be a single object (supports **insert**, **update** and **upsert**) or an array of objects (supports only **insert** of bulk data).

```javascript
// 1. insert single record
const response = await User.save({ 
    data: { 
        firstName: 'John', 
        userEmail: 'john.doe@example.com'
    }
 })

// 2. insert bulk records
const response = await User.save({ 
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
const response = await User.save({ 
    data: {...},
    where: {
        userId: 1
    }
 })
```

`junction` (optional) accepts one of the two string values `'and'` | `'or'` (See [junction](#junction) for details)

```javascript
const response = await User.save({ 
    data: {...},
    where: {...},
    junction: 'and'
 })
```

`groupBy` (optional) used with `having` property to group records, same as explained above (See [groupBy](#groupby) for details)

```javascript
const response = await User.save({ 
    data: {...},
    groupBy: 'userRole',
    having: {...}
 })
```

`having` (optional) similar to `where` property, `having` also helps in **updating** the record(s) in the database (See [having](#having) for more details)

```javascript
const response = await User.save({ 
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
const response = await User.save({ 
    data: {...},
    upsert: {
        name: 'john',
        ...
    }
 })
```

`encrypt` (optional) holds information regarding the `columns` that needs to be **encrypted** and stored in the database. It accepts object in `key: value` format where each `key` represents the **column name** and `value` again is an object with three as key(s) `secret`, `iv` and `sha`

```javascript
const response = await User.save({
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
const response = await User.save({
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
const response = await User.save({
    data: {...},
    debug: 'query'
})
```

### Delete method

`delete` is a static, asynchronous method that is used to dynamically generate valid SQL query that removes record(s) from the database table. `delete` method takes in an object as its parameter with various properties as mentioned below:

```javascript
const response = await User.delete({
    alias: undefined,
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    encryption: {},
    debug: false,
    session: undefined
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

`session` (optional) enables `UnSQL` to **re-use session transaction** provided by `SessionManager` across multiple executions

### Raw Query Method

`rawQuery` method allows you to **execute raw SQL queries** directly. This method is useful when you enjoy writing custom SQL queries or require any specific type of query that you are not able to figure out via. built-in methods. This method supports both type of placeholders: **positional placeholders** `??` | `?` and **named placeholders** `:variableName`, along with dynamically **prepared statement**, `debug` modes, and also can be chained with other built-in (or `rawQuery`) methods using `session` (see [`SessionManager`](#what-is-session-manager-in-unsql)). Below are the samples for both type of placeholders:

1. **Positional Placeholders:** Expects `values` to be an array `['tableName', 'columnName', 'value' [, ...]]` that will be used to **prepare statement** by replacing positional placeholders. Here `??` is used for **table/column names** and `?` is used for **value**. The sequence of placeholders and value in `values` array must be same
```javascript
const response = await User.rawQuery({
    query: 'SELECT * FROM ?? WHERE ?? = ?',
    values: ['users', 'userId', 1],
    debug: true
});
```

1. **Named Placeholders:** Expects `values` to be an object `{ variableName: value [, ...] }` where `variableName` key must match the `:variableName` used in the query, this can be used to replace only the **value(s)** and does not support table/column name. In order to use named placeholders, set `namedPlaceholders: true` inside `createPool` | `createConnection` method configuration
```javascript
const response = await User.rawQuery({
    query: 'SELECT * FROM users WHERE userId = :userId',
    values: { userId: 1 },
    debug: true
});
```

### Export method

`export` is a static, asynchronous method. As the name suggests, it is used to export record(s) from the database table into a dynamically generated **json file** (with same name as `table` property inside `config` property), by default inside `'exports_unsql'` directory. Record(s) can be filtered using `where` property and even columns can also be restricted using the `select` property. **This method only works when `devMode` inside `config` property is set to `true`**. This method is helpful in taking backups of the database table. `export` method takes in an object as its parameter with various properties as mentioned below:

```javascript
await User.export({
    target: User.config.table,
    directory: 'exports_unsql',
    select: ['*'],
    join: [],
    where: {},
    groupBy: [],
    having: {},
    orderBy: [],
    limit: undefined,
    offset: undefined,
    mode: 'append',
    debug: false
})
```

Each of these properties is explained below:

`target` (optional) defines the target, *filename* for the dynamically generated **.json** file or valid `UnSQL` model class, to export record(d) into. Defaults to the `name` of the `table` property of this model class

`directory` (optional) used to change the default name of the dynamically generated directory that contains all exported `.json` files

`select` (optional) limits the columns that will be considered while exporting records, can also be used to manipulate record(s) of selected columns while exporting (see [select](#select) for details)

`where` (optional) filter record(d) based on condition(s) for exporting (see [where](#where) for details)

`groupBy` (optional) groups record(s) by column name(s) to be exported (see [group by](#groupby))

`having` (optional) filter record(s) based on condition(s)/aggregate methods (See [having](#having) for details)

`orderBy` (optional) re-order record(s) by column name(s) to be exported (see [group by](#groupby))

`limit` (optional) limits the record(s) to be extracted

`limit` (optional) sets the starting index of record(s) to be extracted

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

|           Keyword           | Wrapper Type | Description                                                                               |
| :-------------------------: | :----------: | ----------------------------------------------------------------------------------------- |
|  [`str`](#string-wrapper)   |    string    | performs string value related operations                                                  |
|  [`num`](#numeric-wrapper)  |   numeric    | performs numeric value related operations                                                 |
|   [`date`](#date-wrapper)   |     date     | performs date value related operations                                                    |
|  [`and`](#and--or-wrapper)  |   junction   | performs junction override inside the `where` and `having`                                |
|  [`or`](#and--or-wrapper)   |   junction   | performs junction override inside the `where` and `having`                                |
|     [`if`](#if-wrapper)     | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
|   [`case`](#case-wrapper)   | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
|    [`sum`](#sum-wrapper)    |  aggregate   | calculates 'total' from set of values                                                     |
|  [`avg`](#average-wrapper)  |  aggregate   | calculates 'average' from set of values                                                   |
|  [`count`](#count-wrapper)  |  aggregate   | performs 'count' operation on set of values                                               |
|  [`min`](#minimum-wrapper)  |  aggregate   | determines 'lowest' value among the provided values                                       |
|  [`max`](#maximum-wrapper)  |  aggregate   | determines 'highest' value among the provided values                                      |
|   [`json`](#json-wrapper)   |  sub-query   | creates a json object at the position it is invoked                                       |
|  [`array`](#array-wrapper)  |  sub-query   | creates a json array at the position it is invoked                                        |
|  [`refer`](#refer-wrapper)  |  sub-query   | fetch a column from another table at the position it is invoked                           |
| [`concat`](#concat-wrapper) |    merge     | combines multiple values into one                                                         |

> **Please note:** 
> 1. *junction* type wrapper methods can only be used inside `where` and `having` property
> 2. *aggregate* type wrapper methods can only be used inside `select` and `having` property and not with `where` property
> 

All the aforementioned wrappers are explained below along with their interface:

#### String wrapper

**String wrapper** (keyword `str`) is used to perform string/text data related operations, it can be used directly/nested inside `select`, `where`, `having` properties. Below is the interface for string wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
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
                as: null,
                compare: {}
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

`cast` (optional) converts/casts `value` property to the specified *type* / *format* using either of the values `'char'`  | `'nchar'` | `'date'` | `'dateTime'` | `'signed'` | `'unsigned'` | `'decimal'` | `'binary'` | `'integer'`

`decrypt` (optional) is an object with properties `secret`, `iv` (used with CBC mode when `dialect: 'mysql'`) and `sha` used to decrypt `value` property. Overrides configuration(s) provided in local and global `encryption` (see [encryption](#encryption) for details)

`as` (optional) renames/provides local reference name to the `value` property

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`

#### Numeric wrapper

**Numeric wrapper** (keyword `num`) is used to perform mathematical operations on the numeric data, it can be used / nested inside `select`, `where`, `having` clause as a `value`. All the operations are executed sequentially, in order that follows **BODMAS** rule. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    select: [
        { 
            num: {
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
                as: null,
                compare: {}
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

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`

#### Date wrapper

**Date wrapper** (keyword `date`) is used to perform date related operations on `value` property, it can be used nested inside `select`, `where`, `having` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    select: [
        { 
            date: { 
                value: 'column containing date' || date,
                add: 0,
                sub: 0,
                fromPattern: null,
                cast: null,
                decrypt: null,
                format: null,
                as: null,
                compare: {}
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
const response = await User.find({
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
const response = await User.find({
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

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`

#### Date Time Patterns

**Date Time Patterns** can be used with `format` and `fromPattern` properties of `date` wrapper but not with `add` and `sub` property. Below mentioned *date time patterns* (in any desired combination), along with white space `' '` or allowed special characters (`'$'`, `'@'`, `'#'`, `','`, `'-'`, `'_'`, `'/'`) can be used to:
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

| Keyword | Unit               |
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
const response = await User.find({
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
const response = await User.find({
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
const response = await User.find({
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

**Sum wrapper** (keyword `sum`) is used to calculate 'sum' of a set (group) of records. This is an aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
{
    sum: {
        value:'',
        cast: null,
        compare: {},
        as: null
    }
}
const response = await User.find({
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

**Average wrapper** (keyword `avg`) is used to calculate 'average' of a set (group) of records. This is an aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
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

#### Count wrapper

**Count wrapper** (keyword `count`) is used to calculate 'count' among a set (group) of records. This is an aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    select: [
        { 
            count: {
                value: {
                    userStatus: 1
                },
                as: 'activeUsers'
            }
        }
    ]
})
```

#### Minimum wrapper

**Minimum wrapper** (keyword `min`) is used to calculate 'minimum' among a set (group) of records. This is an aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
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

**Maximum wrapper** (keyword `max`) is used to calculate 'maximum' among a set (group) of records. This is an aggregate method hence it will be applied not to single but group of records. It can be used / nested only inside `select` and `having` parameters, and not with `where` clause as a `value`. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
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

**Json wrapper** (keyword `json`) can be used to **extract specific value from json Object** (using `extract` property) or **create/attach json Object to record(s)** by passing Object/Array in `value` property, or even both. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    alias: 'u',
    select: [
        {
            json: {
                value: {},
                table: null,
                alias: null,
                join: [],
                where: {}
                groupBy: [],
                having: {},
                orderBy: {},
                limit: undefined,
                offset: undefined,
                as: null, // Defaults to 'json' (only inside select property) if no 'where' or 'having' property is set
                extract: null,
                compare: {}
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an object `key: value` pair(s) as value. `key` being a string value, `value` can be either string value or a column or any of the UnSQL reserved constants (see [reserved constants](#what-are-unsql-reserved-constants)) or number or nested object

`table` (optional) reference to the child table from which the columns needs to be fetched

`alias` (optional) provides local reference to the child table, see [alias](#alias)

`join` (optional) used to associate another table, see [join](#join)

`where` (optional) used to filter records, see [where](#where)

`groupBy` (optional) groups record(s), see [group by](#groupby)

`having` (optional) used to filter records, see [having](#having)

`orderBy` (optional) re-orders record(s), see [order by](#orderby)

`limit` (optional) limit record(s), see [limit](#limit)

`offset` (optional) set starting index for record(s), see [offset](#offset)

`as` (optional) is used to rename the json object name, if not provided defaults to 'json'

`extract` (optional) available when **column name** containing valid **json object** is passed in `value` property, is used to extract a specified value from this json object. In order to extract any value inside nested json object, keys can be concatenated using `.` symbol

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`


> **Please note:** 
> 1. Using alias is always a good practice but, if the column names inside the two referenced tables are not ambiguous then alias can be excluded
> 2. `as` property is available when this wrapper is used inside `having` and not available when it is being used inside `select` clause
> 3. `value` can either accept either a column name or number value or an object (simple or nested) as its value

#### Array wrapper

**Array wrapper** (keyword `array`) can be used to **extract specific value from json Array** (using `extract` property) or **create/attach json Array to record(s)** by passing Object/Array in `value` property, or even both. This is similar to `json` wrapper however, it can also be used to create an array with multiple json objects. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    alias: 'u',
    select: [
        {
            array: {
                value: [] || {},
                table: null,
                alias: null,
                join: [],
                where: {},
                groupBy: [],
                having: {},
                orderBy: {},
                limit: undefined,
                offset: undefined,
                as: null, // Defaults to 'array' (only inside select property) if no 'where' or 'having' property is set
                extract: null,
                compare: {}
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an array of values or an object in `key: value` pair format as value. `key` being a string , `value` can be either string value or a column name or number or nested object

`table` (optional) reference to the child table from which the columns needs to be fetched

`alias` (optional) provides local reference to the child table, see [alias](#alias)

`join` (optional) used to associate another table, see [join](#join)

`where` (optional) used to filter records, see [where](#where)

`groupBy` (optional) groups record(s), see [group by](#groupby)

`having` (optional) used to filter records, see [having](#having)

`orderBy` (optional) re-orders record(s), see [order by](#orderby)

`limit` (optional) limit record(s), see [limit](#limit)

`offset` (optional) set starting index for record(s), see [offset](#offset)

`as` (optional) is used to rename the json object name, if not provided defaults to 'json'

`extract` (optional) available when **column name** containing valid **json object** is passed in `value` property, is used to extract a specified value from this json object. In order to extract any value inside nested json object, keys can be concatenated using `.` symbol

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`

> **Please note:** 
> 1. Using alias is always a good practice but, if the column names inside the two referenced tables are not ambiguous then alias can be excluded

#### Refer wrapper

**Refer wrapper** (keyword `refer`) is used to run `'sub-query'` to fetch **single field** from any specific record from another `table`. It can be used / nested only inside `select`, `where` and `having` clause as a `value`. This method is helpful to fetch 1 record in a one-to-one relation. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    alias: 'u',
    select: [
        {
            refer: {
                select: ['*'],
                table: 'table_name',
                alias: null,
                join: [],
                where: null, 
                groupBy: [], 
                having: [], 
                orderBy: {}, 
                limit: undefined, 
                offset: undefined,
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

`join` (optional) defines association of another table (as child), see [join](#join) for details

`where` (optional) used to filter records, see [where](#where) for details

`groupBy` (optional) used to group records, see [groupBy](#groupby) for details

`having` (optional) used to filter records with aggregate wrapper methods support, see [having](#having) for details

`orderBy` (optional) used to re-order records, see [orderBy](#orderby) for details

`limit` (optional) used to limit no. of records, see [limit](#limit) for details

`offset` (optional) used to change the starting index for the records to be fetched from, see [offset](#offset) for details

`as` (optional) is used to rename the json array name, if not provided defaults to 'array'

> **Please note:** This wrapper method is very important as it similar to actual `find` method inside `UnSQL`

#### Concat Wrapper

**Concat wrapper** (Keyword `concat`) is used to merge/combine multiple value(s)/columns together into one value. Accepts an array of value(s)/wrapper methods and merges them as one value using `pattern` property as the separator between these values. Below is the interface for this wrapper method along with the default values for each of its properties:

```javascript
const response = await User.find({
    select: [
        {
            concat: { 
                value: [],
                pattern: '',
                as: null,
                compare: null
            }
        }
    ]
})
```

Each of the properties is explained below:

`value` accepts an array of values, these values are similar to `select` (see [select](#select)) property of `find` method (see [find](#find-method))

`pattern` used to connect values in the `value` property. Default is `''`

`as` (optional) is used to provide local reference name to the value returned by this wrapper method

`compare` (optional) used to compare the value returned by this wrapper method using `comparators`

### What are comparators in UnSQL?

**comparator** as the name suggests are used to compare two values. They have a layer of nested object `key: { comparator: value }` pair format like interface where the `key` is compared with the `value` based on the `comparator` used. `key` and `value` can be either string value or column name or number or boolean or any of the built-in wrapper methods. `UnSQL` provides various types of `comparator` as mentioned below:

| Comparator     | Expression       | Description                                                                            |
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

## What is Session Manager in UnSQL?

### Session Manager

`SessionManager` is a class that can be used to create an instance of a `session` object, which provides various *asynchronous* methods (as an interface) to manage the lifecycle of a persistent (reusable) instance of a `transaction` across multiple query executions. `SessionManager` becomes extremely important in cases where multiple inter-linked queries are executed in a chained fashion, one after the other and a mechanism to control all transactions at once if any one of them fails is required. Each lifecycle method is explained below:

| Method     | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `init`     | initializes session (`transaction`)                             |
| `rollback` | undo all (un-committed) changes, reverting to the initial state |
| `commit`   | finalizes all changes, making them permanent (cannot be undone) |
| `close`    | ends the transaction and closes the session                     |

> **Please note:** Constructor requires `connection` or `pool` (recommended)

## Examples

### How to find (read/retrieve) record(s) using UnSQL?

#### Read all records:

```javascript
router.get('/users/:userId(\\d+)', async (req, res)=> {
    const response = await User.find()

    // above code is similar to
    // const response = await User.find({ })

})
```

#### Fetch single user by userId:

```javascript
router.get('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const response = await User.find({
        where: { userId }
    })

    // above code is similar/shorthand for:
    
    // 1. 
    // const response = await User.find({
    //     where: { userId: userId }
    // })

    // 2.
    // const response = await User.find({
    //     where: { userId: { eq: userId } }
    // })
})
```

#### Login example:

```javascript
router.post('/users/login', async (req, res)=> {

    const { loginId, password } = req.body

    const response = await User.find({
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

    const response = await User.find({
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

#### Fetch all users along with the list of recent 5 orders

```javascript
router.get('/users', async (req, res) => {

    const response = await User.find({
        select: ['userId', 'firstName',
            {
                array: {
                    value: {
                        orderId: 'orderId',
                        placedOn: 'createdOn',
                        amount: 'amount'
                    },
                    table: 'orders_placed',
                    where: {
                        userId: 'userId'
                    },
                    limit: 5,
                    orderBy: { createdOn: 'desc' },
                    as: 'order_history'
                }
            }
        ]
    })

})
```

#### Extract value from a Json Array of values

```javascript
router.get('/users', async (req, res) => {

    const response = await User.find({
        select: ['userId', 'firstName',
            {
                array: {
                    value: ['#Jabalpur', '#Delhi', '#Pune'],
                    extract: 0
                    as: 'city'
                }
            }
        ]
    })

})

// Output: city: 'Jabalpur'
```

#### Extract city (at any (*) index value) from a Json Array of Objects

```javascript
router.get('/users', async (req, res) => {

    const response = await User.find({
        select: ['userId', 'firstName',
            {
                array: {
                    value: [{...}],
                    extract: '[*].city'
                    as: 'city'
                }
            }
        ]
    })

})
```

> **Explanation:** In the above sample, `city` will be extracted from all objects in the array
>
> **Please note:** `*` can be replace by a number to fetch city name from a record at that specific index number, else it will return `null` if value is not found or no object is found at that index

#### Extract value from Json Object

```javascript
router.get('/users', async (req, res) => {

    const response = await User.find({
        select: ['userId', 'firstName',
            {
                json: {
                    value: { ..., address: { city: ..., state: ... } },
                    extract: 'address.city'
                    as: 'city'
                }
            }
        ]
    })

})
```

### How to save (insert/update/upsert) data using UnSQL?

#### insert data

```javascript
router.post('/users', async (req, res)=> {

    const data = req.body

    const response = await User.save({ data })

})
```

#### update data

```javascript
router.put('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const data = req.body

    const response = await User.save({ data, where: { userId } })

})
```

#### upsert data

```javascript
router.post('/users', async (req, res)=> {

    const { userId } = req.params

    const data = req.body

    // extract conflicting key (here 'userId') out of payload (data) and create a new object (here upsert) that holds remaining fields that needs to be updated on conflict
    const { userId, ...upsert } = data

    const response = await User.save({ data, upsert })

})
```

### How to delete (remove) record(s) using UnSQL?

#### delete specific record

```javascript
router.delete('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const response = await User.delete({
        where: { userId }
    })

})
```

#### delete multiple record(s)

```javascript
router.delete('/users/:userId(\\d+)', async (req, res)=> {

    const { userId } = req.params

    const response = await User.delete({
        where: { 
            department: ['#salesInterns', '#marketingInterns'],
            {
                date: {
                    value: 'joiningDate',
                    compare: {
                        eq: {
                            date: {
                                value: 'currentDate',
                                sub: '6m'
                            }
                        }
                    }
                }
            }
        }
    })

})
```

> **Explanation:** This will remove all record(s) in the `'salesInterns'` and `'marketInterns'` `'department'` having `'joiningDate'` 6 months (represented by `'6m'`) earlier to this date.

### How to use Session Manager?

Let's assume we are creating an order for 'items' inside user 'bucket':

```javascript
import { SessionManager } from 'unsql'
import { pool } from './path/to/your/db/service'

// Other imports/initializations and code goes here...

router.post('/orders', async (req,res) => {

    // fetch 'userId' from path params
    const { userId } = req.params

    // extract 'data' from body inside request object
    const data = req.body

    // create 'session' instance using 'SessionManager'
    const session = new SessionManager(pool) // 'pool' or 'connection' is required

    // initiate 'transaction' using 'init' lifecycle method
   const initResp =  await session.init()

    // handle if session init failed
    if (!initResp.success) {
        return res.status(400).json(initResp)
    }

    // fetch objects inside bucket, pass 'session' object to the query method
    const bucketResp = await Bucket.find({ where: { userId }, session })

    // create order using 'data' and pass 'session' object to the query method
    const orderResp = await Order.save({ data, session })

    // attach 'orderId' to each item
    const items =  bucketResp.result.map(item => item.orderId = orderResp.insertId )

    // save order 'items' and pass 'session' object to the query method
    const itemsResp = await OrderItems.save({ data: items, session })

    // clear bucket after successfully creating order and pass 'session' object to the query method
    const clearBucket = await Bucket.delete({ where: { userId }, session })

    // handle if any (or all) query failed
    if(!bucketResp.success || !orderResp.success || !itemsResp.success) {
        // rollback changes
        await session.rollback()
        return res.status(400).json({ success: false, message: 'Error while placing order!', error: bucketResp?.error || orderResp?.error || itemsResp?.error })
    }

    // commit changes if no errors were encountered
    await session.commit()
    return res.status(201).json({ success: true, message: 'Order placed successfully!', orderId: orderResp.insertId })
})
```

## FAQs

### How to import UnSQL in model class?

`UnSQL` can be imported using any of the following:

1. CommonJS import
```javascript
const { UnSQL } = require('unsql')
```

2. ES6 Module import
```javascript
import { UnSQL } from 'unsql'
```

### How does UnSQL differentiates between a column name and string value?

Any string value that **starts with a** `#` is considered as a **string value** and any other string that **does not start with** `#` is considered as a **column name**. This `#` is ignored while utilizing the actual string value. If your string value is some sort of code or any value that also has a **#** at the beginning then also an additional `#` as prefix is required else the **#** in your value will be ignored (e.g. `'#someCode'` is required to be written as `'##someCode'`)

```javascript
const response = await User.find({
    select: ['userId', 'firstName', 'lastName', '#test']
    where: {
        firstName: '#Siddharth'
    }
})
```
> **Explanation:** In the above example, `'userId'`, `'firstName'` and `'lastName'` are the column names hence does not start with `#` on the other hand `'test'` and `'Siddharth'` are the string values hence contains `#` as prefix to differentiate them with column names.

### What are Reserved Constants in UnSQL?

Apart from built-in methods, `UnSQL` also has various built-in **reserved constants** (supported by SQL database) as mentioned below:

| Constant           | Description                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `currentDate`      | provides only current **date** in `YYYY-MM-DD` format                                              |
| `currentTime`      | provides only current **time** in `hh:mm:ss` format                                                |
| `now`              | provides both, current **date and time** in `YYYY-MM-DD hh:mm:ss` format, with configured timezone |
| `currentTimestamp` | synonym for `now`                                                                                  |
| `localTimestamp`   | similar to `now` or `timestamp` but in **reference to local timezone**                             |
| `localTime`        | exactly same as `localTimestamp`                                                                   |
| `utcTimestamp`     | provides `currentTimestamp` **in UTC format**                                                      |
| `pi`               | provides value of mathematical constant **pi** i.e. **approx. `3.141593`**                         |
| `isNull`           | provides SQL compatible `IS NULL` value                                                            |
| `isNotNull`        | provides SQL compatible `IS NOT NULL` value                                                        |

### Does UnSQL support SQL Json datatype?

Yes UnSQL provides `json` and `array` wrappers to interact with **SQL json datatype** (`jsonb` for `'postgresql'`). `save` method supports insertion of `data` containing **json Object/Array** into SQL **json datatype** (`TEXT` in `sqlite`) column, UnSQL internally *stringify* the json data data before saving it.

### Support
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white) 
![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJs](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![NextJs](https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

## Author

- [Siddharth Tiwari](https://www.linkedin.com/in/siddharth-tiwari-2775aa97)