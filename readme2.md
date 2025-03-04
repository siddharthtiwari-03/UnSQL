# UnSQL
![NPM Version](https://img.shields.io/npm/v/unsql "production (stable)")
[![GitHub package.json version](https://img.shields.io/github/package-json/v/siddharthtiwari-03/unsql "latest (unstable)")](https://www.github.com/siddharthtiwari-03/unsql)
[![GitHub Release](https://img.shields.io/github/v/release/siddharthtiwari-03/unsql?include_prereleases "latest (release)")](https://github.com/siddharthtiwari-03/UnSQL/releases)
![NPM Downloads](https://img.shields.io/npm/dm/unsql)
![NPM License](https://img.shields.io/npm/l/unsql "UnSQL License")

**UnSQL** is a lightweight, open-source JavaScript library that facilitates class based, schemaless interactions with the structured databases viz. `MySQL`, `PostgreSQL` and `SQLite` through dynamic query generation. It is compatible with javascript runtime environments like NodeJS and NextJS.

## Table of Contents
1. [Overview](#1-overview)
   - [1.1 Breaking Changes](#11-breaking-changes)
   - [1.2 What's new](#12-whats-new)
   - [1.3 Key Features](#13-key-features)
2. [Getting Started](#2-getting-started)
   - [2.1 Prerequisites](#21-prerequisites)
   - [2.2 Installation](#22-installation)
   - [2.3 Setup Guide](#23-setup-guide)
3. [Built-in Query Methods](#3-built-in-query-methods)
   - [3.1 Find Method](#31-find-method)
   - [3.2 Save Method](#32-save-method)
   - [3.3 Delete Method](#33-delete-method)
   - [3.4 Raw Query Method](#34-raw-query-method)
   - [3.5 Export Method](#35-export-method)
   - [3.6 Reset Method](#36-reset-method)
4. Built-in Constants (Reserved Keywords) / Units / Wrapper Objects / Comparator Objects
   - [4.1 Constants (Reserved Keywords)](#41-constants-reserved-keywords)
   - [4.2 Units](#42-units-datetime)
   - [4.3 Wrapper Objects](#43-wrapper-objects)
   - [4.4 Comparator Objects](#44-comparator-objects)
5. Session Manager
6. Examples
7. FAQs

## 1. Overview

**UnSQL** simplifies working with structured databases by dynamically generating SQLs under the hood. It provides developer friendly interface while eliminating the complexities of SQL. UnSQL also utilizes placeholders and prepared statements to prevent SQL-injections.

### 1.1 Breaking Changes

With the release of **version v2.0**, UnSQL has been re-written from scratch to cater modern challenges, including enhanced security and including new features all while also keeping the interface clean and simple, improving the overall developer experience. If your project is still using version v1.x then it is recommended you switch your `import/require` from `'unsql'` to `'unsql/legacy'`, as shown below:

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

> [Documentation for v1.x](https://github.com/siddharthtiwari-03/UnSQL/tree/legacy "Open v1.x documentation") can be found on GitHub

### 1.2 What's New?

**Version v2.1** brings support for **Multiple Dialects**, **Bug Fixes**, **Improved Code Suggestions**, brought back the **rawQuery Method**, enhanced **Session Manager** and better code optimization under the hood and much more

### 1.3 Key Features

- **Promise based** interface with streamlined async/await support
- **Schemaless** eliminates boilerplate code and hectic to manage migrations
- **Class-based Models** encapsulates configurations into clean interface
- **Reuse connections** supports connection `pool` for better performance
- **Dynamic query generation** perform CRUDs without writing SQL
- **Safer code** prevents SQL-injections with placeholders and prepared statements
- **JSON as Response** including execution success/failure acknowledgement and `result` or `error`
- **Transaction** based executions, handles rollbacks on failure
- **Graceful Error Handling** no try-catch required, returns structured error message
- **JSDoc-compatible** for type checking and code suggestions
- **Built-in Debug Modes** (eg.: 'query', 'error', 'benchmarks' etc)
- **Built-in AES Encryption/Decryption** protect sensitive data natively without any third part package

## 2. Getting Started

### 2.1 Prerequisites

UnSQL can work with three different `dialect` of SQL (`'mysql'`, `'postgresql'` and `'sqlite'`). Each of them require different *prerequisite setup* which are utilized by UnSQL as a source of connection `pool` as mentioned below:

- **MySQL (default)** (`dialect: 'mysql'`)

    `mysql2` is the most commonly used package to provided connection `pool` to interact with **MySQL** database.

```javascript
import mysql2 from 'mysql2/promise'

export const pool = createPool({
    ...,
    namedPlaceholders: true, // (optional) required if using rawQuery with named placeholders
    multipleStatements: true // (optional) required if using Encryption/Decryption features
})
```

- **PostgreSQL** (`dialect: 'postgresql'`)

    `pg` is the package required to generate connection `pool`

```javascript
import { Pool } from 'pg'

export const pool = new Pool({...})
```

- **SQLite** (`dialect: 'sqlite'`)

    Both `sqlite` and `sqlite3` packages are required to be installed in your project to interact with SQLite db.

```javascript
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./databases/test.db', err => {
    if (err) console.error('error while opening database', err)
})

module.exports = { db }
```

> **Please note:**
> 1. Named placeholders and multiline statement settings are only required to be configured with MySQL
> 2. Although SQLite provides connection reference (here `db`), it is still used with `pool` property of `config`

### 2.2 Installation

**UnSQL** can be installed using any of the package managers viz. `npm` or `yarn`:

- Using `npm`

```bash
npm i unsql
```

- Using `yarn`

```bash
yarn add unsql
```

### 2.3 Setup Guide

**Unsql** uses class based approach hence, after *prerequisites* and *installation*, next step is to create **model classes**. Each model is mapped to a database table and *extends* from the **UnSQL** base class and has a *static property named* `config` that holds all the *configurations* related to the respective model class. Below if the sample model class using **CommonJS** and **ES6 Module**:

- **user.class.js** (CommonJS)

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

- **user.class.js** (ES6 Module)
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

#### 2.3.1 Config Property

`Config` property is the *heart and soul* of any model class, it **holds all configurations** related to the model class and is used throughout *query generation and execution*. It can also hold global level configurations related to **Encryption/Decryption** for that table so that you don't have to re-define them for each query.

| Property           | Description                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `table`            | (required) name of the database table to be mapped with this model class                                              |
| `pool`             | (required) connection / pool of connection provided by [prerequisite package](#21-prerequisites)                      |
| `safeMode`         | (required) defaults to `true` prevents accidental *delete all* and *reset* query                                      |
| `devMode`          | (required) defaults to `false`, unless `true`, prevents export/import of data                                         |
| `dialect`          | (required) defines the dialect used for dynamic query generation                                                      |
| `encryption`       | (optional) defines various properties viz. `secret`, `iv`, `sha` and `mode` at global level to used by all executions |
| `dbEncryptionMode` | (optional) defaults to `unknown`, defines the encryption mode set on the database                                     |

> **Please note:** 
> 1. `secret` is the **secret key** that is used to encrypt the data
> 2. `iv` and `sha` are only used when `dialect` is set to `'mysql'`, as `postgresql` sets up `iv` internally and `sqlite` does not have any built-in Encryption/Decryption methods
> 3. When `dbEncryptionMode` is same as `mode` inside `encryption` property, in `mysql` dialect, an additional *internal* query that is used to set the `block_encryption_mode` is skipped

## 3. Built-in Query Methods

**Unsql** provides various *static, asynchronous* built-in methods as mentioned below:

| Method     | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `find`     | used to read / retrieve /fetch record(s) from database                              |
| `save`     | used to insert / update / upsert record(s) into database                            |
| `delete`   | used to remove / delete record(s) from database                                     |
| `rawQuery` | used to write custom SQL (manually), can be used for any of type of query execution |
| `reset`    | will remove all record(s) and reset *auto increment* column to initial state        |
| `export`   | can dump record(s) from database to specified `target` (json file or model class)   |

Each of these methods are explained below: 

### 3.1 Find Method

`find` is a static, asynchronous method used to fetch record(s) from the database or add a dummy column(s) with static value(s) while execution. It can also perform several operations like re-order, filter, mutate or even Encryption/Decryption of record(s) while fetching. It can also combine multiple tables as child associations and retrieve record(s) from these tables combined. UnSQL has combined the features of *findOne and findAll* methods into one `find` method, as *findOne* (in other libraries) is just a wrapper around *findAll* to fetch first returning record irrespective of the response set. Interface of `find` method along with its default properties is explained below:

```javascript
const response = await User.find({
    alias: undefined,
    select: ['*'],
    join: [].
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
```

Each of these properties is explained below:

  - <span id="alias">`alias`</span> provides local reference name to the table. It is context sensitive hence when alias are defined in nested objects, each alias is by default attached to all columns inside that context, to use a different alias (from parent or child table), reference to that alias must be prefixed to that column name along with `'.'` symbol in between
  - <span id="select">`select`</span> is an array of values, each value can be column name, static string/number/boolean value, or any of the reserved keyword(s) or wrapper object(s). It is used to restrict the column(s) to be fetched from the database or create dummy column(s), or mutate any value (through wrapper object(s)) at execution
  - <span id="join">`join`</join> is an array of objects where each object represents association of a child table with this parent (model class) table. See for more details on [*join*](#how-join-works-in-unsql)
  - <span id="where">`where`</span> filters record(s) to be fetched from the database based on the conditions provided as simple (or nested) objects in `key: value` pairs, comparator methods, wrapper methods etc.
  - <span id="junction">`junction`</span> determines the connecting clause (`'and'` or `'or'`) that will be used to connect conditions provided inside `where` and `having` properties. Defaults to `'and'`
  - <span id="groupBy">`groupBy`</span> groups record(s) based on the column name(s) provided as an array
  - <span id="having">`having`</span> similar to `where`, filter record(s) based on condition(s) the only difference is that it supports **aggregate object(s)** (in `wrapper objects`)
  - <span id="orderBy">`orderBy`</span> used to define the order in which record(s) are fetched
  - <span id="limit">`limit`</span> limits the number of records to be fetched
  - <span id="offset">`offset`</span> defines the starting index of the record(s) being fetched
  - <span id="encryption">`encryption`</span> defines configurations (similar to `encryption` inside [`config`](#231-config-property) property) but limited to a specific execution (local level)
  - <span id="debug">`debug`</span> enables various debug modes and prints to console: dynamically generated query (un-prepared and prepared statements), values to be injected, errors, benchmarks, based on the selected mode as explained below:

      | Mode               | Description                                                         |
      | ------------------ | ------------------------------------------------------------------- |
      | `'query'`          | logs **prepared**, **un-prepared**, **values**                      |
      | `'error'`          | logs entire error object in the console                             |
      | `'benchmark'`      | logs out the time taken to execute the query                        |
      | `benchmark-query'` | enables combination of `'query'` and `'benchmark'` modes            |
      | `benchmark-error'` | enables combination of `'error'` and `'benchmark'` modes            |
      | `true`             | enables all three modes i.e. `'query'`, `'error'` and `'benchmark'` |
      | `false`            | (default) disables all debug modes                                  |
  - <span id="session">`session`</span> reference of `SessionManager` object, used to **override the transaction/commit/rollback features** to be controlled *externally*

### 3.2 Save Method

`save` is a *static, asynchronous* method, used to **insert | update | upsert** record(s) into the database. It can *insert | update* single or even multiple records (in bulk) in single execution. It also supports data Encryption during this process. When only `data` property is set, this method operates in **insert mode**, when along with `data`, any or both of `where` and `having` are also set, this method operates in **update mode**, and when along with `data`, `upsert` property is set, this method operates in **upsert mode**. Interface along with default values for this method is shown below:

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

Each of these properties is explained below:

   - `alias` same as explained [here](#alias)
   - <span id="data">`data`</span> (required) this is the actual data that will be **inserted | updated** into the database. It can either be a **single object** (supports **insert | update | upsert**) or an **array of objects** (supports **only insert**)
   - `where` same as explained [here](#where), used to filter record(s) to be updated
   - `junction` same as explained [here](#junction)
   - `groupBy` same as explained [here](#groupBy)
   - `having` same as explained [here](#having), used to filter record(s) to be updated
   - <span id="encrypt">`encrypt`</span> accepts `key: value` pair, where `key` can be column name and `value` is another object that holds *configurations* like `secret`, `iv` and `sha` that will be used to encrypt this column. When no properties are set i.e. `value` is set as `{}`, in such a case, *configurations* defined in `encryption` property (local or global) is used. This property helps encrypting different columns with different `secret`
   - `debug` same as explained [here](#debug)
   - `encryption` same as explained [here](#encryption)
   - `session` same as explained [here](#session)

### 3.3 Delete Method

`delete` is a *static, asynchronous* method, used to remove record(s) from the database. `where` and `having` properties are used to *filter* record(s) that will be removed, if no *conditions* are provided in `where` and (or) `having` property, this method will remove all records in the database. `safeMode` property (when set to `true`) in the `config` property of the model class helps prevent accidental *delete all* of the records. Interface for this method along with default values is shown below:

```javascript
// Interface:
{
    alias: undefined,
    where: {},
    junction: 'and',
    groupBy: [],
    having: {},
    encryption: {},
    debug: false,
    session: undefined
}

// Sample:
const response = await User.delete({
    where: {
        joiningDate: {
            between: {
                gt: { date: { value: 'now', sub: '1Y' } }, 
                lt: { date: { value: 'now', sub: '6M' } }
            }
        },
        department: ['sales', 'marketing'],
        userType: 'intern'
    }
})
```

Each of these properties is explained below:

   - `alias` same as explained [here](#alias)
   - `where` same as explained [here](#where), used to filter record(s) to be removed
   - `junction` same as explained [here](#junction)
   - `having` same as explained [here](#having), used to filter record(s) to be removed
   - `debug` same as explained [here](#debug)
   - `encryption` same as explained [here](#encryption)
   - `session` same as explained [here](#session)

### 3.4 Raw Query Method

`rawQuery` method is the most powerful method among all, unlike other methods that are limited to the base mapping, this method is not tied to any particular table, but utilizes the connection pool to execute queries on that database itself. It is capable of executing any and all types of queries including DDL, DML etc. It supports normal queries as well as placeholders: 
   - In `mysql`: 
     - Positional placeholders: `??`, `?`, 
     - Named placeholders: `:namedVariable`, 
     - user defined variables: `@userVariable`, 
   - In `postgresql`: 
     - Positional placeholder: `$1`, `$2`, `$3`...
   - In `sqlite`:
     - Positional placeholder: `?`,
     - Named placeholders: `:namedVariable` or `$namedVariable` or `@namedVariable`,
     - Indexed placeholder: `$1`, `$2`, `$3`... or `?1`, `?2`, `?3`...

### 3.5 Export Method

`export` is a *static, asynchronous* method that works when `devMode: true` is set in `config`, as it is used to **export record(s)** from the database table either **to a .json file** or **to another model class**, depending upon the value set in the `target` property. Interface and default values of this method are shown below:

```javascript
// Interface:
{
    target: 'table_name',
    directory: 'exports_unsql',
    alias: undefined,
    select: ['*'],
    join: [],
    where: {},
    groupBy: [],
    having: {},
    orderBy: [],
    limit: undefined,
    offset: undefined,
    mode: 'append',
    encrypt: undefined,
    encryption: undefined,
    debug: false
}

// Sample: Export to file (this will export all columns to '.json' file)
const response = await User.export()

// Sample: Export to model (limited columns to be exported)
const response = await User.export({
    select: ['firstName', 'lastName', 'email', 'password', 'department', 'salary'],
    target: User2 // another model (can be inside any database)
})
```

Each of these properties are explained below:

   - <span id="target">`target`</span> plays an important role, as it determines if the records will be exported **.to a json file** or to **another model class**. It defaults to the `table` name property inside `config` of the respective model class
     - When set to a string value, record(s) will be exported to a **.json** file with that exact name,
     - When another model class reference is passed as value, record(s) are exported (inserted in) to that model class
   - `directory` determines the name of the folder that will be created (dynamically) to store the dynamically created .json file
   - `alias` same as explained [here](#alias)
   - `select` restricts the column(s) to be exported, also used to mutate values while exporting them including Decryption etc. Same as explained [here](#select)
   - `join` used to associate another table to fetch record(s) together with this table while exporting. Same as explained [here](#join), used to filter record(s) to be removed
   - `where` filter record(s) to be exported. Same as explained [here](#where), used to filter record(s) to be removed
   - `junction` same as explained [here](#junction)
   - `groupBy` same as explained [here](#groupBy)
   - `having` filter record(s) to be exported. Same as explained [here](#having), used to filter record(s) to be removed
   - `orderBy` same as explained [here](#orderBy)
   - `limit` limits the number of record(s) to be exported, Same as explained [here](#limit)
   - `offset` defines the starting index for the record(s) to be exported. Same as explained [here](#offset)
   - `mode` (works when exporting to a json file) when the export is executed and the file already contains data, this property determines whether to `override` or `append` the contents to the file
   - `encrypt` encrypts the columns mentioned as key in this object during export. Same as explained [here](#encrypt)
   - `encryption` same as explained [here](#encryption)
   - `debug` same as explained [here](#debug)

### 3.6 Reset Method

`reset` is a *static, asynchronous* method used to **clear all record(s)** in the model class and also **reset the auto increment ID (if any)** to their initial state. This only works when `devMode: true` and `safeMode: false` in `config`. This only expects one property `debug` in its parameter object. Interface is shown below:

```javascript
const response = await User.reset({ debug: false })
```

## 4. Built-in Constants, Units, Wrapper Objects and Comparator Objects

UnSQL has various Constants (Reserved Keywords), Units (Date/Time), Wrapper Objects and Comparator Objects. Each of them are explained below:

### 4.1 Constants (Reserved Keywords)

`UnSQL` supports various built-in **constants** (supported by SQL) as mentioned below:

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

### 4.2 Units (Date/Time)

**UnSQL** supports various **Date / Time Patterns and Units** for `mysql` and `postgresql` since the units and the format varies for each:

- When using `format` or `fromPattern` (only supported by `mysql`) property:

    | MySQL | PostgreSQL        | SQLite              | Description                                                                 |
    | ----- | ----------------- | ------------------- | --------------------------------------------------------------------------- |
    | `%a`  | `Dy`              | `%w` (0-6, Sun-Sat) | Abbreviated weekday name (Sun to Sat)                                       |
    | `%b`  | `Mon`             | *Not supported*     | Abbreviated month name (Jan to Dec)                                         |
    | `%c`  | `FMMonth`/`FMMon` | *Not supported*     | Numeric month name (0 to 12)                                                |
    | `%D`  | `FMDDth`          | *Not supported*     | Day of the month as a numeric value, followed by suffix (1st, 2nd, 3rd,...) |
    | `%d`  | `DD`              | `%d` (01-31)        | Day of the month as a numeric value (01 to 31)                              |
    | `%e`  | `FMDD`            | `%e`                | Day of the month as a numeric value (0 to 31)                               |
    | `%f`  | `US`              | `%f` (fractions)    | Microseconds (000000 to 999999)                                             |
    | `%H`  | `HH24`            | `%H` (00-23)        | Hour (00 to 23)                                                             |
    | `%h`  | `HH12`            | `%I` (01-12)        | Hour (00 to 12)                                                             |
    | `%I`  | `HH12`            | `%I` (01-12)        | Hour (00 to 12)                                                             |
    | `%i`  | `MI`              | `%M` (00-59)        | Minutes (00 to 59)                                                          |
    | `%j`  | `DDD`             | `%j` (001-366)      | Day of the year (001 to 366)                                                |
    | `%k`  | `FMHH24`          | `%H` (0-23)         | Hour (0 to 23)                                                              |
    | `%l`  | `FMHH12`          | `%I` (1-12)         | Hour (1 to 12)                                                              |
    | `%M`  | `Month`           | *Not supported*     | Month name in full (January to December)                                    |
    | `%m`  | `MM`              | `%m` (00-12)        | Month name as a numeric value (00 to 12)                                    |
    | `%p`  | `AM/PM`           | `%p` / `%P`         | AM or PM / am or pm                                                         |
    | `%r`  | `HH12:MI:SS AM`   | `%I:%M:%S %p`       | Time in 12-hour AM/PM format (hh:mm:ss AM/PM)                               |
    | `%s`  | `SS`              | `%S` (00-59)        | Seconds (00 to 59)                                                          |
    | `%T`  | `HH24:MI:SS`      | `%H:%M:%S`          | Time in 24-hour format (hh:mm:ss)                                           |
    | `%U`  | `WW`              | *Not supported*     | Week where Sunday is the 1st day of the week (00 to 53)                     |
    | `%u`  | `IW`              | `%U`                | Week where Monday is the 1st day of the week (00 to 53)                     |
    | `%V`  | `WW`              | *Not supported*     | Week where Sunday is the 1st day of the week (01 to 53). Used with `%X`     |
    | `%v`  | `IW`              | *Not supported*     | Week where Monday is the 1st day of the week (01 to 53). Used with `%x`     |
    | `%W`  | `Day`             | *Not supported*     | Weekday name in full (Sunday to Saturday)                                   |
    | `%w`  | `D`               | `%w` (0-6, Sun=0)   | Day of the week where Sunday=0 and Saturday=6                               |
    | `%X`  | `IYYY`            | *Not supported*     | Year for the week (Sunday being 1st day of the week). Used with `%V`        |
    | `%x`  | `IYYY`            | *Not supported*     | Year for the week (Monday being 1st day of the week). Used with `%v`        |
    | `%Y`  | `YYYY`            | `%Y` (4-digit)      | Year (4-digit)                                                              |
    | `%y`  | `YY`              | `*Not supported*    | Year (2-digit)                                                              |

> **Please note:**
> 1. Due to weird implementation in `postgresql`, if random whitespaces appear while formatting **Date/Time**, use `FFMonth` / `FFMon` instead of `Month` / `Mon`
> 2. `fromPattern` property / feature is only supported by `mysql` and neither by `postgresql` nor by `sqlite`

- When using `add` / `sub` property:

    | MySQL | PostgreSQL    | SQLite                    | Unit        |
    | ----- | ------------- | ------------------------- | ----------- |
    | `f`   | `MICROSECOND` | `%f` (fractional seconds) | MICROSECOND |
    | `s`   | `SECOND`      | `%S` (00-59)              | SECOND      |
    | `m`   | `MINUTE`      | `%M` (00-59)              | MINUTE      |
    | `h`   | `HOUR`        | `%H` (00-23)              | HOUR        |
    | `d`   | `DAY`         | `%d` (01-31)              | DAY         |
    | `w`   | `WEEK`        | *Not supported*           | WEEK        |
    | `M`   | `MONTH`       | `%m` (01-12)              | MONTH       |
    | `q`   | `QUARTER`     | *Not supported*           | QUARTER     |
    | `y`   | `YEAR`        | `%Y` (4-digit)            | YEAR        |

> **Please note:** You can use them in combination like `2d 5m 1M 10y` in `add` and (or) `sub`

### 4.3 Wrapper Objects

UnSQL provides various built-in **special objects** to perform various specialized actions. Following is the list of special objects:

|       Keyword       |    Type     | Description                                                       |
| :-----------------: | :---------: | ----------------------------------------------------------------- |
|    [`str`](#str)    |   string    | perform string based operations                                   |
|    [`num`](#num)    |   numeric   | perform mathematical operations                                   |
|   [`date`](#date)   |    date     | perform date related operations                                   |
|    [`and`](#and)    |  junction   | perform junction override inside `where` and `having` property    |
|    [ `or`](#or)     |  junction   | perform junction override inside `where` and `having` property    |
|     [`if`](#if)     | conditional | checks **condition** and returns respective *true or false value* |
|   [`case`](#case)   | conditional | checks multiple **conditions** and return respective *value*      |
|    [`sum`](#sum)    |  aggregate  | **calculates total** from set of values                           |
|  [`avg`](#average)  |  aggregate  | **calculates average** from set of values                         |
|  [`count`](#count)  |  aggregate  | **performs count** operation on set of values                     |
|  [`min`](#minimum)  |  aggregate  | **determines lowest value** among the provided values             |
|  [`max`](#maximum)  |  aggregate  | **determines highest value** among the provided values            |
|   [`json`](#json)   |  sub-query  | **performs json object/array** related operations                 |
|  [`refer`](#refer)  |  sub-query  | fetch a column from another table at the position it is invoked   |
| [`concat`](#concat) |    merge    | combines multiple values into one                                 |

All objects are explained below:

- #### **String wrapper** (Keyword <span id="str">`str`</span>): 
  Performs string/text based operation(s) on `value` property. Interface with default properties is shown below:

    ```javascript
    // Interface:
    {
        str: {
            value: 'some value / column containing text',
            replace: {
                target: null, // chars to be replaced
                with: null // replace with
            }, 
            reverse: false, // rearrange characters in reverse order
            textCase: null, // transform text case to 'upper' or 'lower'
            padding: { // maintains min. no. of chars. by filing text
                left: { // fill missing text to left direction
                    length: null, // min. chars to maintain
                    pattern: null // text to fill
                },
                right: { // fill missing text to right direction
                    length: null, // min. chars to maintain
                    pattern: null // text to fill
                }
            },
            substr: { // create sub-string
                start: 0, // start index for sub-string
                length: null // length of the sub-string
            },
            trim: false, // remove whitespace from 'left' / 'right' or both
            cast: null, // type cast 'value' into 'binary', 'unsigned', 'char' etc.
            decrypt: null, // decrypt 'value' using properties inside this
            encoding: 'utf8mb4', // convert decrypted buffer array using this
            as: null, // local reference name to this object 'value'
            compare: {} // compare 'value' returned, similar to 'where' and 'having'
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                str: {
                    value: 'firstName',
                    textCase: 'upper'
                }
            },
            {
                str: {
                    value: 'userBio',
                    substr: {
                        start: 1,
                        length: 50
                    },
                    as: 'shortBio' // (optional) rename to 'shortBio'
                }
            },
            {
                str: {
                    value: 'email',
                    decrypt: {
                        secret: 'mySecret',
                        iv: 'customIV'
                    }
                }
            }
        ],
        encryption: {
            mode: 'aes-256-cbc'
        }
    })
    ```

    **Please note:**

    1. **All properties are optional** and can be used in **any combination**
    2. All operations are performed on `value` property
    3. `reverse` and `padding` are not supported by `sqlite`
    4. <span id="cast">`cast`</span> can be any of the values: 
    - For `mysql`: 
        - `'char'`  | `'nchar'` | `'date'` | `'dateTime'` | `'signed'` | `'unsigned'` | `'decimal'` | `'binary'`
    - For `postgresql`:
        - `'integer'` | `'text'` | `'timestamp'` | `'numeric'`
    - For `sqlite`:
        - `'integer'` | `'text'` | `'real'` | `'blob'`
    5. <span id="decrypt">`decrypt`</span> is an important property that holds an object with following properties:
    - <span id="secret">`secret`</span> is the **secret key** when provided here, will **override** all other **secret** properties defined (if any) on execution level `encryption` property or global level `encryption` (inside `config`)
    - <span id="iv">`iv`</span> (Initialization Vector) only used with `mysql`. Should be same for Encryption/Decryption. `postgresql` manages `iv` internally and does not require to be entered manually.
    - <span id="sha">`sha`</span> determines the **hash algorithm** to be used (defaults to `512`) only used by `mysql`. `postgresql` does not require this.
    6. `sqlite` does not support built-in AES Encryption/Decryption hence will throw error if values are set
    7. <span id="encoding">`encoding`</span> (only used with `mysql`) determines the character set to be used while decrypting data. It can be any character set supported by `mysql` like: `'utf8mb4'` (default) | `'latin1'` | `'ascii'` | `'utf8'` | `'ucs2'` | `'utf16'` etc
    8. <span id="compare">`compare`</span> is similar to `where` and `having`, it compares value returned by this object to the condition specified in this object.

- #### **Numeric Wrapper** (Keyword <span id="num">`num`</span>): 
  Performs **Numerical/Mathematical** operation(s) on `value` property. Follows the rules of **BODMAS** when performing multiple operations. Interface with default properties is shown below:

    ```javascript
    // Interface:
    { 
        num: {
            value: 'some number/ column containing number',
            decimal: null, // limit no. of decimal or round-off: 'floor'/'ceil'/'round'
            mod: null, // calculate modulus of 'value' by this number
            sub: 0, // subtract this from 'value'
            add: 0, // add this to 'value'
            multiplyBy: null, // multiply 'value' by this number
            divideBy: null, // divide 'value' by this number
            power: null, // apply this as power of 'value'
            cast: null, // type cast 'value' into 'binary', 'unsigned', 'char' etc.
            decrypt: null, // decrypt 'value' using properties inside this
            encoding: 'utf8mb4', // convert decrypted buffer array using this encoding
            as: null, // local reference name to this object 'value'
            compare: {} // compare 'value' returned, similar to 'where' and 'having'
        } 
    }

    // Sample:
    const response = await Specs.find({
        select: [
            { 
                num: {
                    value: 'calories',
                    decimal: 2, // limit decimals to 2 places '.00'
                    multiplyBy: 100,
                    divideBy: 'quantity',
                    as: 'unitCalories'
                } 
            }
        ]
    })
    ```

    **Please note:**

    1. **All properties are optional** and can be used in **any combination**
    2. All operations are performed on `value` property
    3. See [cast](#cast), [decrypt](#decrypt), [encoding](#encoding), [compare](#compare) for respective details

- #### **Date Wrapper** (Keyword <span id="date">`date`</span>):
  Performs **Date/Time** operation(s) on `value` property. Interface along with default properties is shown below:

    ```javascript
    // Interface:
    { 
        date: { 
            value: 'column containing date' || date,
            add: null, // add days as no. or any combination of days, months, years
            sub: null, // sub. days as no. or any combination of days, months, years
            fromPattern: null, // create date from any string (date) pattern
            cast: null, // type cast 'value' into 'binary', 'unsigned', 'char' etc.
            decrypt: null, // decrypt 'value' using properties inside this
            encoding: 'utf8mb4', // convert decrypted buffer array using this encoding
            format: null, // format 'value' to desired form using pattern defined here
            as: null, // local reference name to this object 'value'
            compare: {} // compare 'value' returned, similar to 'where' and 'having'
        } 
    }

    // Sample:
    const response = await User.find({
        select: [
            { 
                date: { 
                    value: 'joiningDate',
                    add: '6M', // adds 6 months to 'joiningDate'
                    format: 'null',
                    as: 'probationEndDate'
                } 
            }
        ]
    })
    ```

    **Please note:**

    1. **All properties are optional** and can be used in **any combination**
    2. All operations are performed on `value` property
    3. `fromPattern` is not supported by `sqlite`
    4. See [cast](#cast), [decrypt](#decrypt), [encoding](#encoding), [compare](#compare) for respective details

- #### And (Keyword <span id="and">`and`</span>) / Or (Keyword <span id="or">`or`</span>) Wrappers
    Both `and` wrapper and `or` wrapper are similar in interface as both accepts array of comparator objects, only difference is `and` wrapper joins these comparator objects with **and** clause and `or` wrapper joins these comparator objects using **or** clause. They override `junction` property for their immediate children comparator objects and can be nested inside each other to create complex conditions. Since there is no *interface*, below is a sample for **and / or wrapper**:

    ```javascript
    // Interface:
    { and: [ {...}, {...}, ...] } // and wrapper
    { or: [ {...}, {...}, ...] } // or wrapper

    // Sample:
    const response = await User.find({
        where: {
            or: [
                { salary: { between: { gt: 5000, lt: 15000 } } }, // condition1
                { role: 'intern' } // condition2
            ],
            userStatus: 1 // condition3
        }
    })
    // creates: ((condition1 or condition2) and condition3)
    ```

    **Please note:**
    
    1. Both wrappers works only with `where` and `having` property

- #### If Wrapper (Keyword <span id="if">`if`</span>):

    Creates a **if-else check** and returns appropriate value. Below is the interface and default properties:

    ```javascript
    // Interface:
    {
        if: {
            check: {...}, // condition to be checked
            trueValue:'', // returns this value if 'check' is true
            falseValue: '', // returns this value if 'check' is false
            as: null // local reference name to this object 'value'
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                if: {
                    check: { experience: { lt: 1 } },
                    trueValue:'Fresher',
                    falseValue: 'Experienced',
                    as: 'level'
                }
            }
        ]
    })
    ```

- #### Case Wrapper (Keyword <span id="case">`case`</span>):

    Similar to a **switch case**, `check` contains array of conditional objects, each object containing `when` (condition to be checked) and `then` (value to be returned if respective `when` is `true`). Also contains a default `else` value when no condition is `true`. Below is the interface with default values:

    ```javascript
    // Interface:
    {
        case: [
            { // conditional object
                when: {...}, // condition to be checked
                then: 'some value' // value if 'when' is true
            },
            ...
        ],
        else: 'default value', // if no condition in any of the 'when' is true
        as: null
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                case: [
                    {
                        when: { experience: { lt: 2 } },
                        then: 'Fresher'
                    },
                    {
                        when: { experience: { between: { gt: 2, lt: 4 } } },
                        then: 'Junior'
                    },
                    {
                        when: { experience: { between: { gt: 4, lt: 7 } } },
                        then: 'Mid-level'
                    },
                ],
                else: 'Senior',
                as: 'expertise'
            }
        ]
    })
    ```

- #### Sum Wrapper (Keyword <span id="sum">`sum`</span>):

    **Calculate total** based on column name or condition. Can be chained to compare using comparator object. Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        sum: {
            value: 'some column', // or conditional object {...}
            distinct: false, // when true, ignore duplicate column values
            distinct: false, // when true, distinct column values will be considered
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            { sum: {
                value: 'salary',
                cast: 'signed', // convert to 'singed' (number)
                as: 'totalSalary'
                }
            }
        ],
        groupBy: ['department'],
        having: {
            sum: { 
                value: 'salary',
                compare: { gt: 5000 }
            }
        }
    })
    ```

- #### Average Wrapper (Keyword <span id="avg">`avg`</span>):

    **Calculate average** based on column name or condition. Can be chained to compare using comparator object. Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        avg: {
            value: 'some column', // or conditional object {...}
            distinct: false, // when true, distinct column values will be considered
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                avg: {
                    value: 'salary',
                    cast: 'unsigned',
                    as: 'averageSalary',
                }
            }
        ],
        groupBy: ['department'],
        having: {
            avg: {
                value: 'salary',
                compare: { gt: 15000 }
            }
        }
    })
    ```

- #### Count Wrapper (Keyword <span id="count">`count`</span>):

    **Calculate count** based on column name or condition. Can be chained to compare using comparator object. Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        count: {
            value: 'some column', // or conditional object {...}
            distinct: false, // when true, distinct column values will be considered
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                count: {
                    value: '*',
                    distinct: true,
                    as: 'totalEmployees',
                }
            }
        ],
        groupBy: ['department']
    })
    ```

- #### Min Wrapper (Keyword <span id="min">`min`</span>):

    **Calculate lowest value** based on column name or condition. Can be chained to compare using comparator object. Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        min: {
            value: 'some column', // or conditional object {...}
            distinct: false, // when true, distinct column values will be considered
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // sample
    const response = await User.find({
        select: [
            {
                min: {
                    value: 'salary',
                    cast: 'unsigned',
                    as: 'lowestSalary'
                }
            }
        ]
    })
    ```

- #### Max Wrapper (Keyword <span id="max">`max`</span>):

    **Calculate highest value** based on column name or condition. Can be chained to compare using comparator object. Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        max: {
            value: 'some column', // or conditional object {...}
            distinct: false, // when true, distinct column values will be considered
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                max: {
                    value: 'salary',
                    distinct: true,
                    cast: 'unsigned',
                    as: 'highestSalary'
                }
            }
        ]
    })
    ```

- #### Json Wrapper (Keyword <span id="json">`json`</span>):

    Can be used to **create** json object/array during execution or by using values from a sub-query or combination of both, **extract values** from json object/array, check if json contains certain value or not. Supports full sub-query properties (similar to `find` method). Part of *aggregate methods*, is executed on group of record(s). Below is the interface and default values:

    ```javascript
    // Interface:
    {
        json: {
            value: {...}, // 'column name' or array [...]
            table: null, // table in sub-query to refer value to be used to create json
            alias: null, // local reference name for the table
            join: [], // associate another table as child
            where: {} // filter record(s) in sub-query
            groupBy: [], // group record(s) in sub-query
            having: {}, // filter record(s) in sub-query (also using aggregate methods)
            orderBy: {}, // re-order record(s) in sub-query
            limit: undefined, // limit record(s) in sub-query
            offset: undefined, // reset start index in sub-query
            extract: null, // extract values from json object / array
            contains: null, // check if this value is contained in json object / array
            aggregate: false, // when true, distinct column values will be considered
            decrypt: null, // type cast value to 'signed', 'unsigned' etc
            cast: null, // type cast value to 'signed', 'unsigned' etc
            as: null, // local reference name to this object 'value'
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        alias: 'u',
        select: [
            {
                json: {
                    value: {
                        orderId: 'orderId',
                        purchaseDate: 'createdOn',
                        orderAmount: 'totalAmount',
                        orderStatus: 'orderStatus'
                    },
                    table: 'order_history',
                    where: {
                        userId: 'u.userId'
                    },
                    aggregate: true,
                    as: 'orders',
                }
            }
        ]
    })
    ```

    **Please note:**

    1. If `value` is object, it will create json object
    2. If `value` is array, it will crate json array
    3. If `value` can also accept column name as string
    4. `aggregate` can be set to `true` to combine multiple json objects/arrays

- #### Refer Wrapper (Keyword <span id="refer">`refer`</span>)

    Performs sub-query to extract value from another table, it is similar to have reference of entire `find` method as a special object, with all the properties (with additional `table` property) same as `find` method. Below is the interface and default values:

    ```javascript
    // Interface:
    {
        table: null, // table in sub-query to refer value to be used to create json
        alias: null, // local reference name for the table
        select: [], // column to be extracted
        join: [], // associate another table as child
        where: {} // filter record(s) in sub-query
        groupBy: [], // group record(s) in sub-query
        having: {}, // filter record(s) in sub-query (also using aggregate methods)
        orderBy: {}, // re-order record(s) in sub-query
        limit: undefined, // limit record(s) in sub-query
        offset: undefined, // reset start index in sub-query
        decrypt: null, // type cast value to 'signed', 'unsigned' etc
        cast: null, // type cast value to 'signed', 'unsigned' etc
        as: null, // local reference name to this object 'value'  
    }

    // Sample:
    const response = await User.find({
        alias: 'u',
        select: [
            ...,
            {
                refer: {
                    select: ['departmentName'],
                    from: 'departments_table',
                    where: {
                        departmentId: 'u.departmentId'
                    }
                }
            }
        ],
        where: {
            userStatus: 1
        }
    })
    ```

- #### Concat Wrapper (Keyword <span id="concat">`concat`</span>)

    Used to combine (concat) multiple values using string `pattern`.

    ```javascript
    // Interface:
    {
        concat: { 
            value: [], // list of values / special objects to be combined
            pattern: '', // pattern to be used to connect values
            as: null, // local reference name to this object 'value'  
            compare: {} // comparator object
        }
    }

    // Sample:
    const response = await User.find({
        select: [
            {
                concat: {
                    value: ['firstName', 'lastName'],
                    as: 'fullName'
                }
            }
        ]
    })
    ```

### 4.4 Comparator Objects

UnSQL provides various objects to **compare different values**, as mentioned below:

|   Comparator   |    Expression     | Description                                                                          |
| :------------: | :---------------: | ------------------------------------------------------------------------------------ |
|      `eq`      |        `=`        | compares, `key` **is equal** to `value`                                              |
|    `notEq`     |       `!=`        | compares, `key` **is not equal** to `value`                                          |
|      `gt`      |        `>`        | compares, `key` **is greater than** to `value`                                       |
|      `lt`      |        `<`        | compares, `key` **is lower than** to `value`                                         |
|     `gtEq`     |       `>=`        | compares, `key` **is greater than** to `value`                                       |
|     `ltEq`     |       `<=`        | compares, `key` **is lower than** to `value`                                         |
|   `between`    | `BETWEEN ? AND ?` | checks, `key` is in a range of values                                                |
|      `in`      |       `IN`        | checks, `key` has an **exact match** in the provided set of values in `value`        |
|    `notIn`     |     `NOT IN`      | checks, `key` **does not have exact match** in the provided set of values in `value` |
|     `like`     |   `LIKE '%?%'`    | **fuzzy search**, `value` **contains** `key` **at any position**                     |
|   `notLike`    | `NOT LIKE '%?%'`  | **fuzzy search**, `value` **does not contain** `key` **at any position**             |
|  `startLike`   |    `LIKE '?%'`    | **fuzzy search**, `value` **begins with** `key`                                      |
| `notStartLike` |  `NOT LIKE '?%'`  | **fuzzy search**, `value` **does not begins with** `key`                             |
|   `endLike`    |    `LIKE '%?'`    | **fuzzy search**, `value` **ends with** `key`                                        |
|  `notEndLike`  |  `NOT LIKE '%?'`  | **fuzzy search**, `value` **does not ends with** `key`                               |