# UnSQL
![NPM Version](https://img.shields.io/npm/v/unsql "production (stable)")
![NPM Downloads](https://img.shields.io/npm/dm/unsql)
![NPM License](https://img.shields.io/npm/l/unsql "UnSQL License")

**UnSQL** is a scalable, lightweight, open-source JavaScript library for class-based interactions with `MySQL`, `PostgreSQL` and `SQLite` through dynamic query generation - no SQL required. It is the only library that supports a single codebase across all three dialects. Works with **ExpressJS**, **Fastify**, **NextJS**, **AWS Lambda**, **Vercel**, and **ElectronJS**.

## Table of Contents

1. [Overview](#1-overview)
   - [1.1 Breaking Changes](#11-breaking-changes)
   - [1.2 What's New](#12-whats-new)
   - [1.3 Key Features](#13-key-features)
2. [Getting Started](#2-getting-started)
   - [2.1 Prerequisites](#21-prerequisites)
   - [2.2 Installation](#22-installation)
   - [2.3 Setup Guide](#23-setup-guide)
3. [Built-in Methods](#3-built-in-methods)
4. [Querying](#4-querying)
   - [4.1 Fetching Records](#41-fetching-records)
   - [4.2 Inserting and Updating Records](#42-inserting-and-updating-records)
   - [4.3 Deleting Records](#43-deleting-records)
   - [4.4 Raw Queries](#44-raw-queries)
   - [4.5 Exporting Records](#45-exporting-records)
   - [4.6 Resetting a Table](#46-resetting-a-table)
5. [Built-in Constants / Units / Wrapper Objects / Comparator Objects](#5-built-in-constants-units-wrapper-objects-and-comparator-objects)
   - [5.1 Constants (Reserved Keywords)](#51-constants-reserved-keywords)
   - [5.2 Units (Date/Time)](#52-units-datetime)
   - [5.3 Wrapper Objects](#53-wrapper-objects)
   - [5.4 Comparator Objects](#54-comparator-objects)
6. [Session Manager](#6-session-manager)
7. [Examples](#7-examples)
8. [FAQs](#8-faqs)

---

## 1. Overview

**UnSQL** dynamically generates SQL under the hood from plain JavaScript objects, eliminating the need to write or maintain raw queries. It uses parameterized statements throughout to prevent SQL injection, and returns structured `{ success, result }` responses on every execution - no try/catch required.

---

### 1.1 Breaking Changes

**Version v2.3** - `save` method fully rewritten. The following are breaking changes:

**1. `upsert` format changed from object `{}` to array `[]`**
**2. `junction` property (was being used in `where` and `having` clause) is dropped in favour of newer `and` and `or` wrappers**

```javascript
// ❌ v2.2 and below
await User.save({ data, upsert: { likes: 1, views: 1 } })

// ✅ v2.3+
await User.save({ data, upsert: ['views', { likes: { add: 1 } }] })
```

**2. `indexes` parameter added - required for PostgreSQL and SQLite upsert**

```javascript
// PostgreSQL / SQLite must now specify the conflict target column(s)
await User.save({
    data: { email: 'john@example.com', name: 'John' },
    upsert: ['name'],
    indexes: ['email']
})
```

---

**Version v2.2.4** - SQLite only. `insertId` and `changes` moved inside `result`:

```javascript
{ success: true, result: { insertId, changes } }
```

---

**Version v2.0** - complete rewrite. If using v1.x, update your import:

```javascript
// v1.x - add '/legacy' to keep using the old API
import UnSQL from 'unsql/legacy'

// v2.x
import { UnSQL } from 'unsql'
```
> [v1.x documentation](https://github.com/siddharthtiwari-03/UnSQL/tree/legacy) is on GitHub.
---

### 1.2 What's New?

**Version v2.4**

- **Aggregate Window** - aggregate wrappers `sum` `count` `avg` `min` `max` now have `over` property for advanced **window queries**
- **Enhance Upsert** - arithmetic operations in upsert now use table prefix
- **Atomic Transactions** - all queries now use atomic transactions, unless *Session Manager* is used for transaction lifecycle hooks
- **Faster Execution** - internal code optimization to result in roughly 10-15% faster query generation
- **Session Manager stabilized** - handled transaction lifecycle exceptions
- **New Rank Window Functions** - `rank` `denseRank` `percentRank` `rowNum` `nTile` added to built-in [wrapper objects](#53-wrapper-objects)
- **New Value Window Functions** `firstValue` `lastValue` `nthValue` added to built-in [wrapper objects](#53-wrapper-objects)
- **New Offset Window Functions** - `lead` `lag` added to built-in [wrapper objects](#53-wrapper-objects)
- **Standardized ifNull property** - `IFNULL` / `ISNULL` replaced with dialect agnostic `COALESCE`
- **ifNull support in sub-query** - `ifNull` support added to `refer` and `json` wrappers

**Version v2.3**

- **Documentation** - fresh (query based instead of interface focused) approach for documentation for better understanding
- **Bulk insert with encryption** across all dialects
- **Bulk upsert** across all dialects
- **Upsert encryption** - upsert now supports proper encryption
- **Upsert operations** - chained arithmetic (`add`, `sub`, `mul`, `div`, `mod`) and subquery references (`refer`) on conflict
- **`orderBy.using`** - new array for expression-based sorting: derived columns, aggregates, date expressions, subquery references
- **~98% faster SQL generation** - internal code generation optimized
- **improved benchmarks** - method and log generated while benchmarking improved
- **encryption / decryption cleaned** - underlying code for encryption and decryption cleaned
- **New debug mode** - `sandbox` is added to debug mode, lets you debug generated SQL without actually executing them on database

**Version v2.2** - TypeScript support with `.d.ts` files and enhanced type hinting.

**Version v2.1** - multiple dialect support, unified codebase, `rawQuery` restored, Session Manager improvements.

---

### 1.3 Key Features

- **Promise-based** async/await interface
- **Schemaless** - no migration files, no boilerplate model definitions
- **Unified codebase** - one codebase, three SQL dialects
- **Class-based models** - config and query logic in one clean class
- **SQL injection safe** - all values parameterized, identifiers typed
- **Structured responses** - always `{ success, result }` or `{ success: false, error }`
- **Transaction support** - `SessionManager` handles begin/commit/rollback across queries
- **Graceful error handling** - no try/catch needed in application code
- **JSDoc-compatible** - full IDE type checking and autocomplete
- **Built-in debug modes** - inspect SQL, errors, and benchmarks
- **Built-in AES Encryption/Decryption** - no third-party packages needed

---

## 2. Getting Started

### 2.1 Prerequisites

UnSQL needs a connection pool from a dialect-specific driver.

**MySQL** - install `mysql2`

```javascript
import mysql2 from 'mysql2/promise'

export const pool = mysql2.createPool({
    host: 'localhost',
    database: 'test_db',
    user: 'your_username',
    password: 'your_password',
    connectionLimit: 20,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    namedPlaceholders: true,    // required for named placeholders in rawQuery
    multipleStatements: true    // required for multiple statements in rawQuery
})
```

**PostgreSQL** - install `pg`

```javascript
import { Pool } from 'pg'

export const pool = new Pool({
    host: 'localhost',
    database: 'test_db',
    user: 'your_username',
    password: 'your_password'
})
```

**SQLite** - install `sqlite` and `sqlite3`

```javascript
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export const pool = (async () => {
    return await open({ filename: './test.db', driver: sqlite3.Database })
})()
```

> For remote databases (e.g. AWS RDS), deploy your application in the same cloud region as the database. Network latency otherwise dominates query time regardless of SQL complexity.

---

### 2.2 Installation

```bash
npm i unsql       # npm
yarn add unsql    # yarn
pnpm add unsql    # pnpm
```

---

### 2.3 Setup Guide

Create a **model class** for each database table. Every model extends `UnSQL` and declares a static `config` property.

```javascript
// @ts-check
import { UnSQL } from 'unsql'
import { pool } from './db'   // your pool from section 2.1

/** @extends UnSQL */
export class User extends UnSQL {

    /** @type {UnSQL.config} */
    static config = {
        table: 'users',     // (required) table name
        pool,               // (required) connection pool
        safeMode: true,     // prevents accidental delete-all / reset
        devMode: false,     // required to use export / reset
        dialect: 'mysql'    // 'mysql' (default) | 'postgresql' | 'sqlite'
    }

}
```

That's all the setup needed. You can now call `User.find()`, `User.save()`, `User.delete()`, etc.

#### Config Options

| Property           | Default     | Description                                                                                             |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------- |
| `table`            | -           | (required) database table name                                                                          |
| `pool`             | -           | (required) connection pool from driver                                                                  |
| `safeMode`         | `true`      | blocks delete-all and reset when true                                                                   |
| `devMode`          | `false`     | must be `true` to use `export` and `reset`                                                              |
| `dialect`          | `'mysql'`   | `'mysql'` \| `'postgresql'` \| `'sqlite'`                                                               |
| `encryption`       | -           | global encryption config (`secret`, `iv`, `sha`, `mode`) applied to all queries on this model           |
| `dbEncryptionMode` | `'unknown'` | when this matches `encryption.mode`, UnSQL skips the internal `SET block_encryption_mode` query (MySQL) |

---

## 3. Built-in Methods

UnSQL provides 06 *static, asynchronous* methods out of the box. Each of these methods helps you to perform different operations

| Method     | Description                                                                     |
| ---------- | ------------------------------------------------------------------------------- |
| `find`     | fetch record(s) from database                                                   |
| `save`     | insert / update / upsert record(s) into database                                |
| `delete`   | remove / delete record(s) from database                                         |
| `rawQuery` | write custom SQL (manually), for more freedom                                   |
| `reset`    | will remove all record(s) and reset *auto increment* column to initial state    |
| `export`   | can dump record(s) in database to specified `target` (json file or model class) |

---

## 4. Querying

### 4.1 Fetching Records

`find` is a static, asynchronous method that generates a `SELECT` query. It returns `{ success: true, result: [...] }` on success.

The simplest call fetches all records:

```javascript
const response = await User.find()

// SELECT * FROM `users`
```

#### Filtering with `where`

Pass a `where` object to filter results. Keys are column names, values are the conditions to match:

```javascript
const response = await User.find({
    where: { status: 1, role: '#admin' }
})

// SELECT * FROM `users` WHERE `status` = 1 AND `role` = 'admin'
```

> UnSQL uses `#` as a prefix to pass a **plain text string**. Without `#`, a string is treated as a **column reference**. So `role: '#admin'` → `role = 'admin'`, while `role: 'parentRole'` → `role = parentRole`.

For `IN` conditions, pass an array:

```javascript
await User.find({
    where: { department: ['#sales', '#engineering'] }
})

// SELECT * FROM `users` WHERE `department` IN ('sales', 'engineering')
```

For range and comparison conditions, use [comparator objects](#44-comparator-objects):

```javascript
await User.find({
    where: {
        age: { ltEq: 65 },
        joiningDate: { between: { gt: '2024-01-01', lt: 'now' } },
        name: { startLike: '#John' }
    }
})

// SELECT * FROM `users`
// WHERE `age` <= 65
// AND `joiningDate` BETWEEN '2024-01-01' AND NOW()
// AND `name` LIKE CONCAT('John', "%")
```

To mix `AND` and `OR` logic, use nested `or` / `and` objects:

```javascript
const loginId = 'test@unsql.dev'

await User.find({
    where: {
        or: [
            { email: `#${loginId}` },
            { mobile: `#${loginId}` }
        ],
        status: 1
    }
})

// SELECT * FROM `users`
// WHERE (`email` = 'test@unsql.dev' OR `mobile` = 'test@unsql.dev') AND `status` = 1
```

#### Selecting Specific Columns

Pass a `select` array to restrict which columns are returned:

```javascript
await User.find({
    select: ['userId', 'firstName', 'email'],
    where: { status: 1 }
})

// SELECT `userId`, `firstName`, `email` FROM `users` WHERE `status` = 1
```

#### Sorting

Pass an `orderBy` object mapping column names to `'asc'` or `'desc'`:

```javascript
await User.find({
    orderBy: { createdOn: 'desc', firstName: 'asc' }
})

// SELECT * FROM `users` ORDER BY `createdOn` DESC, `firstName` ASC
```

> **Please note:** `'asc'` and `'desc'` are in lower case

To sort by an **expression** - an aggregate, date operation, or subquery - use the `using` array inside `orderBy`:

```javascript
await User.find({
    alias: 'u',
    select: ['userId', 'firstName'],
    orderBy: {
        using: [{
            refer: {
                alias: 'w',
                select: ['points'],
                table: 'user_wallets',
                where: { userId: 'u.userId' } // comparing userId in reference table and parent table
            },
            order: 'desc'
        }]
    }
})

// SELECT `u`.`userId`, `u`.`firstName` FROM `users` `u`
// ORDER BY (SELECT `w`.`points` FROM `user_wallets` `w` WHERE `w`.`userId` = `u`.`userId`) DESC
```

> **Please Note:** To reference any parent table column (having same names) inside any child wrapper (here `refer`) parent alias is required (here `'u.userId'`)

Each entry in `using` supports one expression key - `sum`, `avg`, `count`, `min`, `max`, `date`, or `refer` - alongside `order: 'asc' | 'desc'`.

To sort by a derived column, prefix the derived column name with `'_'` to make UnSQL identify that column as a *derived column* instead of regular column names in the database table

```javascript
await User.find({
    alias: 'u',
    select: ['userId', 'firstName', { refer: { table:'user_wallet', alias:'w', select: ['points'], where: { userID : `u.userID` }, as: 'points' } }],
    orderBy: { _points: 'desc', userId: 'desc' }
})

// SELECT `u`.`userId`, `u`.`firstName`, (SELECT `w.`points` FROM `user_wallet` `w` WHERE `w`.`userID` = `u`.`userID`) AS 'points' FROM `users` `u`
// ORDER BY points DESC, `u`.`userID` DESC
```

> **Please note:** since `points` is a derived column name, we have prefixed it with `'_'` to let UnSQL identify it apart from normal column name

#### Pagination

Use `limit` and `offset` together:

```javascript
await User.find({
    where: { status: 1 },
    orderBy: { createdOn: 'desc' },
    limit: 10,
    offset: 20   // skip first 20, return records 21–30
})

// SELECT * FROM `users` WHERE `status` = 1 ORDER BY `createdOn` DESC LIMIT 10 OFFSET 20
```

#### Grouping and Aggregates

Use `groupBy` with aggregate [wrapper objects](#aggregates) in `select` and `having`:

```javascript
await User.find({
    select: [
        'department',
        { count: { value: '*', as: 'headCount' } },
        { avg: { value: 'salary', cast: 'unsigned', as: 'avgSalary' } }
    ],
    groupBy: ['department'],
    having: {
        avg: { value: 'salary', compare: { gt: 50000 } }
    },
    orderBy: {
        using: [{ count: { value: '*' }, order: 'desc' }]
    }
})

// SELECT `department`, COUNT(*) AS `headCount`, CAST(AVG(`salary`) AS UNSIGNED) AS `avgSalary`
// FROM `users`
// GROUP BY `department`
// HAVING AVG(`salary`) > 50000
// ORDER BY COUNT(*) DESC
```

> **Please note:** Similar to `orderBy`, `groupBy` also supports grouping by *derived column names*, we need to prefix the derived column name with `'_'` to let UnSQL identify it apart from the normal column names in the database

#### Joining Tables

Pass a `join` array to associate child tables. Each entry needs a `table` and `using` (the join column):

```javascript
// Simple join - no select/where inside the join object
await User.find({
    alias: 'u',
    select: ['userId', 'firstName', 'o.orderDate'],
    join: [{
        type: 'left', alias: 'o', table: 'orders',
        using: ['userId']   // array for same column name or object { parentCol: childCol } for different names
    }]
})

// SELECT `u`.`userId`, `u`.`firstName`, `o`.`orderDate`
// FROM `users` `u`
// LEFT JOIN `orders` `o` USING (`userId`)
```

> **Please Note:** To refer any column from the child table, prefix it with the child table's alias (here `'o.orderDate'`)

When you add `select` or `where` inside a join object, UnSQL wraps the joined table in a subquery. In that case `as` is required as the subquery alias:

```javascript
// Subquery join - triggered by select + as inside the join object
await User.find({
    alias: 'u',
    select: ['userId', 'firstName', 'o.orderId', 'o.amount'],
    join: [{
        type: 'left',
        table: 'orders',
        alias: 't1',
        select: ['orderId', 'amount'],
        where: { status: 1 },
        using: { userId: 'customerId' }, // assuming orders table stores userId as customerId
        as: 'o' // required when select or where is set
    }]
})

// SELECT `u`.`userId`, `u`.`firstName`, `o`.`orderId`, `o`.`amount`
// FROM `users` `u`
// LEFT JOIN (SELECT `t1`.`orderId`, `t1`.`amount` FROM `orders` `t1` WHERE `t1`.`status` = 1) AS `o` ON `userId` = `customerId`
```

> **Please note:** 
> - Assuming column names are different, we use `{ parentColumn: childColumn }` approach, doing so we ignore prefixing any column with their respective table alias. 
> - When we use { parentColumn: childColumn } approach, keyword in the generated query changes to `ON` instead of `USING` but the parameter name remains the same (`using`)
> - When we restrict the columns in the join, only those columns are available for filter or to be referenced outside.

Available join types: 

- `left`: All records from the parent with only connected records from child
- `right`: All records from the child and only connected records from parent (not supported by `SQLite`)
- `inner`: only matching rows based on `using` column(s)
- `cross`: cartesian product of records in parent and child tables
- `fullOuter`: All records from both tables, regardless of matching condition (`PostgreSQL` only)
- `natural`: based on columns with the same name and datatype (automatically detected)

#### Aliases

`alias` gives a table a short reference name, which is automatically prefixed to all columns in that scope:

```javascript
await User.find({ alias: 'u' })

// SELECT `u`.* FROM `users` `u`
```

To reference a column from a parent scope inside any child scope like `join` or `refer` etc, prefix the alias manually: `'u.userId'`.

#### Decryption

To decrypt an encrypted column during fetch, use the [`str` wrapper](#string-wrapper) with `decrypt`:

```javascript
await User.find({
    select: [
        'userId',
        { str: { value: 'email', decrypt: {}, as: 'email' } }
    ],
    encryption: { secret: '#my_secret_value', iv: 'ivColumnName', mode: 'aes-256-cbc' }
})
```

#### Debug Mode

Pass `debug` to inspect the generated query or benchmark execution:

```javascript
await User.find({ where: { userId: 1 }, debug: 'query' })

// ******************************************************************
//                    UnSQL Debug Query Begins
// ------------------------------------------------------------------
// Un-prepared: SELECT ?? FROM ?? WHERE ?? = ?
// Values:      [ 'userId', 'users', 'userId', 1 ]
// Prepared:    SELECT `userId` FROM `users` WHERE `userId` = 1
// ------------------------------------------------------------------
//                    UnSQL Debug Query Ends
// ******************************************************************
```

| `debug` value       | Output                                              |
| ------------------- | --------------------------------------------------- |
| `'query'`           | un-prepared query, values, and prepared query       |
| `'error'`           | full error object on failure                        |
| `'sandbox'`         | debug generated query without actually executing it |
| `'benchmark'`       | execution time (includes network round-trip)        |
| `'benchmark-query'` | query + benchmark combined                          |
| `'benchmark-error'` | error + benchmark combined                          |
| `true`              | all of the above                                    |
| `false`             | (default) disabled                                  |

> **Benchmark note:** The timer measures the full database round-trip. For remote databases, network latency dominates this number.

#### `find` - All Options

```javascript
await User.find({
    alias: undefined,       // local reference name for the table
    select: ['*'],          // columns / expressions to return
    join: [],               // child table associations
    where: {},              // filter conditions - use and/or wrappers for mixed logic
    groupBy: [],            // columns to group by
    having: {},             // post-group filter (supports aggregates)
    orderBy: {},            // sort order - columns or using[] for expressions
    limit: undefined,       // max records to return
    offset: undefined,      // starting index for pagination
    encryption: {},         // query-level encryption config (overrides config.encryption)
    debug: false,           // debug mode
    session: undefined      // SessionManager instance for transaction control
})
```

---

### 4.2 Inserting and Updating Records

`save` is a static, asynchronous method that generates `INSERT`, `UPDATE`, or `INSERT ... ON DUPLICATE KEY UPDATE` queries depending on what parameters are provided.

#### Inserting a Single Record

Pass a single object to `data`:

```javascript
await User.save({
    data: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
})

// INSERT INTO `users` (`firstName`, `lastName`, `email`) VALUES ('Jane', 'Doe', 'jane@example.com')
```

#### Bulk Insert

Pass an array of objects. All objects must share the same keys. A single `INSERT` statement is generated for the entire array:

```javascript
await User.save({
    data: [
        { firstName: 'Jane', lastName: 'Doe' },
        { firstName: 'John', lastName: 'Smith' },
        { firstName: 'Jack', lastName: 'Ryan' }
    ]
})

// INSERT INTO `users` (`firstName`, `lastName`) VALUES ('Jane', 'Doe'), ('John', 'Smith'), ('Jack', 'Ryan')
```

#### Updating a Record

Add a `where` clause to switch to update mode:

```javascript
await User.save({
    data: { firstName: 'Jane', status: 1 },
    where: { userId: 42 }
})

// UPDATE `users` SET `firstName` = 'Jane', `status` = 1 WHERE `userId` = 42
```

#### Upsert

Add a `upsert` array to handle conflicts. Each entry defines what happens to a column when the record already exists.

A string entry re-inserts the incoming value as-is:

```javascript
await User.save({
    data: { email: 'jane@example.com', firstName: 'Jane', loginCount: 0 },
    upsert: ['firstName']
    // indexes: ['email']  ← required for PostgreSQL / SQLite
})

// INSERT INTO `users` (`email`, `firstName`, `loginCount`)
// VALUES ('jane@example.com', 'Jane', 0) AS EXCLUDED
// ON DUPLICATE KEY UPDATE `firstName` = EXCLUDED.`firstName`
```

An object entry applies an arithmetic operation on the existing value:

```javascript
await User.save({
    data: { email: 'jane@example.com', firstName: 'Jane', loginCount: 0, score: 0 },
    upsert: [
        'firstName',
        { loginCount: { add: 1 } },         // loginCount = loginCount + 1
        { score: { add: 10, sub: 2 } }       // score = score + 10 - 2  (chained)
    ]
})

// INSERT INTO `users` (`email`, `firstName`, `loginCount`, `score`) VALUES ('jane@example.com', 'Jane', 0, 0) AS EXCLUDED ON DUPLICATE KEY UPDATE
//   `firstName` = EXCLUDED.`firstName`,
//   `loginCount` = `users`.`loginCount` + 1,
//   `score` = `users`.`score` + 10 - 2
```

Supported operations: `add` (+), `sub` (−), `mul` (×), `div` (÷), `mod` (%), `refer` (subquery).

To update a column using a value from another table on conflict, use `refer`:

```javascript
await User.save({
    data: { email: 'jane@example.com', wallet: 0 },
    upsert: [{
        wallet: {
            refer: {
                alias: 'w',
                select: ['points'],
                table: 'user_wallets',
                where: { userId: `${User.config.table}.userId` }
            }
        }
    }]
})

// ON DUPLICATE KEY UPDATE
//   `wallet` = (SELECT `w`.`points` FROM `user_wallets` `w` WHERE `w`.`userId` = `users`.`userId`)
```

#### Encrypting Columns

Pass an `encrypt` object where each key is the column to encrypt. Set the value to `{}` to use the global encryption config, or provide per-column overrides:

```javascript
import crypto from 'crypto'

const ivLocal = crypto.randomBytes(16).toString('hex')

await User.save({
    data: { email: 'jane@example.com', password: 'secret123', ssn: '123-45-6789', iv: ivLocal  },
    encrypt: {
        password: {},                                    // uses config.encryption / encryption param
        ssn: { secret: '#altSecret', iv: `#${ivLocal}` } // per-column override
    },
    encryption: { secret: '#globalSecret', iv: { refer: { table: 'secured_ivs', select:['iv'], alias: 'i', where: { accountType: '#user' } } }, sha: 512, mode: 'aes-256-cbc' }
})

// INSERT INTO `users` (`email`, `password`, `ssn`)
// VALUES ('jane@...', AES_ENCRYPT('secret123', 'globalSecret', UNHEX(SHA2((SELECT `i`.`iv` FROM `secured_ivs` `i` WHERE `i`.`accountType` = 'user'), 512))), 
// AES_ENCRYPT('123-45-6789', 'altSecret', UNHEX(SHA2('ivLocal_value...', 512))))
```

> **Please note:** 
> - Encryption is not supported for `dialect: 'sqlite'`.
> - Initialization Vector (iv) can either be a valid binary array or a string value (prefixed with `#`) or a column reference (string without `#` prefix) that stores a valid iv
> - iv can also be referenced from another table (here from `secured_ivs` for global iv)

#### Response Shape

```javascript
// MySQL
{ success: true, result: { affectedRows: 1, insertId: 1, changedRows: 0, ... } }

// PostgreSQL
{ success: true, result: [{...}] }   // affected row returned

// SQLite
{ success: true, result: { insertId: 1, changes: 1 } }
```

#### `save` - All Options

```javascript
await User.save({
    alias: undefined,   // local reference name for the table
    data,               // (required) object (insert/update/upsert) or array (bulk insert)
    where: {},          // filter conditions for update mode
    upsert: [],         // conflict resolution entries - strings or { col: { op } } objects
    indexes: [],        // conflict target columns - required for PostgreSQL / SQLite upsert
    encrypt: {},        // column-level encryption - { colName: { secret, iv, sha } | {} }
    encryption: {},     // query-level encryption config
    debug: false,
    session: undefined
})
```

> **SQLite upsert note:** MySQL and PostgreSQL only update columns listed in `upsert` on conflict. SQLite's `INSERT OR REPLACE` replaces the entire row - columns not listed in `upsert` are set to `null` or their column default.

---

### 4.3 Deleting Records

`delete` generates a `DELETE` query. Pass `where` to target specific records.

```javascript
await User.delete({ where: { userId: 42 } })

// DELETE FROM `users` WHERE `userId` = 42
```

`where` supports the same conditions as `find` - comparators, arrays, nested `or`/`and` for mixed logic:

```javascript
await User.delete({
    where: {
        department: ['#sales', '#marketing'],
        joiningDate: {
            between: {
                gt: { date: { value: 'now', sub: '6M' } },
                lt: { date: { value: 'now', sub: '1M' } }
            }
        }
    }
})

// DELETE FROM `users`
// WHERE `department` IN ('sales', 'marketing')
// AND `joiningDate` BETWEEN DATE_SUB(NOW(), INTERVAL 6 MONTH) AND DATE_SUB(NOW(), INTERVAL 1 MONTH)
```

Calling `delete()` with no arguments deletes all records. This is blocked by default when `safeMode: true` (the default) in `config`. Set `safeMode: false` to allow it.

```javascript
await User.delete()   // requires safeMode: false in config

// DELETE FROM `users`
```

---

### 4.4 Raw Queries

`rawQuery` executes any SQL directly using the model's connection pool. It is not tied to the model's table - it gives access to the entire database. Useful for DDL, complex queries that can't be expressed through `built-in methods`, or multi-statement operations.

```javascript
await User.rawQuery({
    sql: 'SELECT * FROM users WHERE userId = ?',
    values: [42]
})
```
It supports normal as well as parameterized (with placeholders) queries: 
 - In `mysql`: 
   - Positional placeholders: `??`, `?`, 
   - Named placeholders: `:namedVariable`, 
   - user defined variables: `@userVariable`, 
 - In `postgresql`: 
   - Positional placeholder: `$1`, `$2`, `$3`...
 - In `sqlite`:
   - Positional placeholder: `?`,
   - Named placeholders: `:namedVariable` or `$namedVariable` or `@namedVariable`,
   - Indexed placeholder: `?1`, `?2`, `?3`...

```javascript
// MySQL - positional placeholders
await User.rawQuery({ sql: 'SELECT * FROM ?? WHERE ?? = ?', values: ['users', 'userId', 42] })

// MySQL - named placeholders
await User.rawQuery({ sql: 'SELECT * FROM users WHERE userId = :userId', values: { userId: 42 } })

// PostgreSQL - indexed placeholders
await User.rawQuery({ sql: 'SELECT * FROM users WHERE userId = $1', values: [42] })

// SQLite - named or indexed
await User.rawQuery({ sql: 'SELECT * FROM users WHERE userId = :userId', values: { userId: 42 } })
```

For MySQL, set `multiQuery: true` to execute multiple statements in one call:

```javascript
await User.rawQuery({
    sql: `CREATE TABLE IF NOT EXISTS users (userId INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100));
          CREATE TABLE IF NOT EXISTS orders (orderId INT PRIMARY KEY AUTO_INCREMENT, userId INT);`,
    multiQuery: true
})
```

For SQLite, set `methodType` explicitly:

| `methodType` | Use case                                                    |
| ------------ | ----------------------------------------------------------- |
| `'all'`      | SELECT - returns array of records. Supports Session Manager |
| `'run'`      | INSERT / UPDATE - returns `insertId` and `changes`          |
| `'exec'`     | CREATE / DROP / ALTER - returns nothing                     |

---

### 4.5 Exporting Records

`export` fetches records (same as `find`) and writes them either to a `.json` file or bulk-inserts them into another model class. Requires `devMode: true` in `config`. Supports all wrapper objects for operations like encryption/decryption, filters etc. 

Acceptable values for `target` (optional property):
- `string` value for `'file_name'`
- Valid `UnSQL model class` to export to a model

```javascript
// Export all records to a .json file (named after the table by default)
await User.export()

// → writes to exports_unsql/users.json
```

```javascript
// Export selected columns to another model (bulk inserts into that table)
await User.export({
    select: ['firstName', 'lastName', 'email'],
    target: ArchiveUser // another UnSQL model - must also have devMode: true
})
```

```javascript
// Export with filters, override (or append) if file already exists else create new one
await User.export({
    where: { status: 0 },
    target: 'inactive_users', // file name - writes to exports_unsql/inactive_users.json
    mode: 'override' // (optional) 'override' | 'append'
})
```

All `find` parameters (`where`, `select`, `join`, `orderBy`, `limit`, etc.) are supported and work identically.

---

### 4.6 Resetting a Table

`reset` truncates the table and resets auto-increment IDs. Requires `safeMode: false` and `devMode: true` in `config`.

```javascript
await User.reset()

// TRUNCATE TABLE `users`
```

---

## 5. Built-in Constants, Units, Wrapper Objects and Comparator Objects

### 5.1 Constants (Reserved Keywords)

These strings can be used anywhere a value is expected and map directly to SQL constants:

| Constant           | SQL equivalent                                                |
| ------------------ | ------------------------------------------------------------- |
| `now`              | `NOW()` - current date and time                               |
| `currentTimestamp` | synonym for `now`                                             |
| `currentDate`      | `CURDATE()` - current date only                               |
| `currentTime`      | `CURTIME()` - current time only                               |
| `localTimestamp`   | current timestamp in local timezone                           |
| `localTime`        | same as `localTimestamp`                                      |
| `utcTimestamp`     | current timestamp in UTC                                      |
| `pi`               | `PI()` - approx. `3.141593`                                   |
| `null`             | `IS NULL`                                                     |
| `isNull`           | `IS NULL`                                                     |
| `isNotNull`        | `IS NOT NULL`                                                 |
| `NotNull`          | `IS NOT NULL`                                                 |
| `jsonArray`        | `JSON_ARRAY()` or `JSON_BUILD_ARRAY()` (**for PostgreSQL**)   |
| `jsonObject`       | `JSON_OBJECT()` or `JSON_BUILD_OBJECT()` (**for PostgreSQL**) |

```javascript
// Sample: find users who joined today
await User.find({ where: { joiningDate: 'currentDate' } })

// SELECT * FROM `users` WHERE `joiningDate` = CURDATE()
```

---

### 5.2 Units (Date/Time)

UnSQL provides unified date/time symbols that translate to the correct syntax for each dialect.

**Format symbols** - used in `date.format` and `date.fromPattern`:

| Symbol | Meaning                             | Symbol | Meaning                                  |
| :----: | ----------------------------------- | :----: | ---------------------------------------- |
|  `d`   | Day, single digit (1–31)            |  `H`   | Hour 24h, single digit (0–23)            |
|  `dd`  | Day, double digit (01–31)           |  `HH`  | Hour 24h, double digit (00–23)           |
|  `D`   | Day with ordinal (1st, 2nd...)      |  `h`   | Hour 12h, single digit (1–12)            |
|  `dy`  | Abbreviated day name (Sun, Mon...)  |  `hh`  | Hour 12h, double digit (01–12)           |
|  `Dy`  | Full day name (Sunday, Monday...)   |  `m`   | Minute, single digit                     |
| `dow`  | Day of week number (0=Sun to 6=Sat) |  `mm`  | Minute, double digit                     |
| `doy`  | Day of year (001–366)               |  `s`   | Second, single digit                     |
|  `M`   | Month, single digit (1–12)          |  `ss`  | Second, double digit                     |
|  `MM`  | Month, double digit (01–12)         |  `ms`  | Microseconds                             |
| `Mon`  | Abbreviated month (Jan, Feb...)     |  `a`   | am/pm                                    |
| `MON`  | Full month name (January...)        |  `A`   | AM/PM                                    |
|  `y`   | Year, two digits (24, 25)           |  `w`   | Week number (00–53)                      |
|  `Y`   | Year, four digits (2024, 2025)      |  `q`   | Quarter (1–4) - MySQL/SQLite unsupported |

> Wrap literal text in square brackets inside `format` strings: `'[Joined on] dd MON Y'`
> `fromPattern` is not supported by SQLite.

**Date arithmetic units** - used in `date.add` and `date.sub`:

| Symbol | Unit                 |
| :----: | -------------------- |
|  `f`   | Microsecond          |
|  `s`   | Second               |
|  `m`   | Minute               |
|  `h`   | Hour                 |
|  `d`   | Day                  |
|  `w`   | Week (not SQLite)    |
|  `M`   | Month                |
|  `q`   | Quarter (not SQLite) |
|  `y`   | Year                 |

Units can be combined: `'2y 3M 10d'`

---

### 5.3 Wrapper Objects

UnSQL provides special *JSON structures* as **Wrapper objects** that generate SQL expressions at the position they are placed. They work inside `select`, `where`, `having`, `orderBy.using`, and can be nested.

|            Keyword             | Wrapper Type | Description                                                                               |
| :----------------------------: | :----------: | ----------------------------------------------------------------------------------------- |
|    [`str`](#string-wrapper)    |    string    | performs string value related operations                                                  |
|   [`num`](#numeric-wrapper)    |   numeric    | performs numeric value related operations                                                 |
|    [`date`](#date-wrapper)     |     date     | performs date value related operations                                                    |
|    [`and`](#and-or-wrapper)    |   junction   | performs junction override inside the `where` and `having`                                |
|    [`or`](#and-or-wrapper)     |   junction   | performs junction override inside the `where` and `having`                                |
|      [`if`](#if-wrapper)       | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
|    [`case`](#case-wrapper)     | conditional  | checks **condition** and returns respective value (used with `select`, `where`, `having`) |
|  [`sum`](#aggregate-wrapper)   |  aggregate   | calculates 'total' from set of values                                                     |
|  [`avg`](#aggregate-wrapper)   |  aggregate   | calculates 'average' from set of values                                                   |
| [`count`](#aggregate-wrapper)  |  aggregate   | performs 'count' operation on set of values                                               |
|  [`min`](#aggregate-wrapper)   |  aggregate   | determines 'lowest' value among the provided values                                       |
|  [`max`](#aggregate-wrapper)   |  aggregate   | determines 'highest' value among the provided values                                      |
|   [`lead`](#offset-wrapper)    |    offset    | Accesses data from a subsequent row at a specified physical offset from the current row   |
|    [`lag`](#offset-wrapper)    |    offset    | Accesses data from a previous row at a specified physical offset from the current row     |
|    [`rank`](#rank-wrapper)     |     rank     | Assigns a rank to each row with gaps in the sequence for tied values                      |
|  [`denseRank`](#rank-wrapper)  |     rank     | Assigns a rank to each row without gaps in the sequence for tied values                   |
| [`percentRank`](#rank-wrapper) |     rank     | Calculates the relative rank of a row as a percentage (0 to 1)                            |
|   [`rowNum`](#rank-wrapper)    |     rank     | Assigns a unique sequential number to each row within a partition                         |
|    [`nTile`](#rank-wrapper)    |     rank     | Distributes rows into a specified number of approximately equal groups (buckets)          |
| [`firstValue`](#value-wrapper) |    value     | Returns the first value in an ordered set of values (within a window frame)               |
| [`lastValue`](#value-wrapper)  |    value     | Returns the last value in an ordered set of values (within a window frame)                |
|  [`nthValue`](#value-wrapper)  |    value     | Returns the value of the argument at the N-th row of the window frame                     |
|    [`json`](#json-wrapper)     |  sub-query   | creates a json object/array of object(s) at the position it is invoked                    |
|   [`refer`](#refer-wrapper)    |  sub-query   | fetch a column from another table at the position it is invoked                           |
|  [`concat`](#concat-wrapper)   |    merge     | merges multiple column/string values into single string                                   |

---

- #### String Wrapper <span id="string-wrapper">(`str`)</span>

    Performs string operations on `value`. Generates `UPPER()`, `LOWER()`, `SUBSTR()`, `TRIM()`, `LPAD()`, `RPAD()`, `REVERSE()`, `REPLACE()`, `CAST()`, and `AES_DECRYPT()` as needed.

    ```javascript
    // Uppercase a column
    await User.find({
        select: [{ str: { value: 'firstName', textCase: 'upper', as: 'name' } }]
    })
    // SELECT UPPER(`firstName`) AS `name` FROM `users`

    // Extract a substring
    await User.find({
        select: [{ str: { value: 'bio', substr: { start: 1, length: 100 }, as: 'shortBio' } }]
    })
    // SELECT SUBSTR(`bio`, 1, 100) AS `shortBio` FROM `users`

    // Decrypt an encrypted column
    await User.find({
        select: [{
            str: { value: 'email', decrypt: { secret: 'mySecretColumn', iv: 'ivColumn' }, as: 'email' }
        }],
        encryption: { mode: 'aes-256-cbc' }
    })
    ```

    All `str` options:

    | Option     | Description                                                                                                                                                                                |
    | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `value`    | column name or string to operate on                                                                                                                                                        |
    | `replace`  | `{ target, replaceWith }` - always plain text, no `#` prefix needed                                                                                                                        |
    | `reverse`  | reverse character order (not SQLite)                                                                                                                                                       |
    | `textCase` | `'upper'` \| `'lower'`                                                                                                                                                                     |
    | `padding`  | `{ left: { length, pattern }, right: { length, pattern } }` (not SQLite)                                                                                                                   |
    | `substr`   | `{ start, length }`                                                                                                                                                                        |
    | `trim`     | `true` \| `'left'` \| `'right'`                                                                                                                                                            |
    | `ifNull`   | provide a fallback (default) value in case the `value` gets null value from database                                                                                                       |
    | `cast`     | MySQL: `'char'`,`'signed'`,`'unsigned'`,`'decimal'`,`'binary'`,`'date'`,`'dateTime'` / PG: `'integer'`,`'text'`,`'timestamp'`,`'numeric'` / SQLite: `'integer'`,`'text'`,`'real'`,`'blob'` |
    | `decrypt`  | `{ secret, iv, sha }` - overrides all other encryption config for this column                                                                                                              |
    | `encoding` | MySQL only - character set for decrypted output. Default `'utf8mb4'`                                                                                                                       |
    | `as`       | output alias                                                                                                                                                                               |
    | `compare`  | comparator conditions on the returned value                                                                                                                                                |

---

- #### Numeric Wrapper <span id="numeric-wrapper">(`num`)</span>

    Performs mathematical operations on `value`. Follows BODMAS order.

    ```javascript
    await Specs.find({
        select: [{
            num: { value: 'calories', multiplyBy: 100, divideBy: 'quantity', decimals: 2, ifNull: 0, as: 'unitCalories' }
        }]
    })
    // MySQL:  SELECT FORMAT((`calories` * 100) / `quantity`, ?) AS `unitCalories` FROM `specs`
    // PG/SQLite: SELECT ROUND((`calories` * 100) / `quantity`, ?) AS `unitCalories` FROM `specs`
    ```

    | Option       | Description                                                                          |
    | ------------ | ------------------------------------------------------------------------------------ |
    | `value`      | column name or number                                                                |
    | `add`        | add to value                                                                         |
    | `sub`        | subtract from value                                                                  |
    | `multiplyBy` | multiply value                                                                       |
    | `divideBy`   | divide value                                                                         |
    | `mod`        | modulus                                                                              |
    | `power`      | raise to power                                                                       |
    | `decimals`   | decimal places (integer) \| `'floor'` \| `'ceil'` \| `'round'`                       |
    | `ifNull`     | provide a fallback (default) value in case the `value` gets null value from database |
    | `cast`       | same options as `str.cast`                                                           |
    | `decrypt`    | same as `str.decrypt`                                                                |
    | `as`         | output alias                                                                         |
    | `compare`    | comparator conditions on the returned value                                          |

---

- #### Date Wrapper <span id="date-wrapper">(`date`)</span>

    Performs date/time operations on `value`.

    ```javascript
    // Add 6 months and format
    await User.find({
        select: [{
            date: { value: 'joiningDate', add: '6M', format: 'dd MON Y', as: 'probationEnd' }
        }]
    })
    // SELECT DATE_FORMAT(DATE_ADD(`joiningDate`, INTERVAL 6 MONTH), '%d %b %Y') AS `probationEnd`

    // Filter by relative date range
    await User.find({
        where: {
            createdOn: {
                between: {
                    gt: { date: { value: 'now', sub: '30d' } },
                    lt: 'now'
                }
            }
        }
    })
    // WHERE `createdOn` BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND NOW()
    ```

    | Option        | Description                                                                          |
    | ------------- | ------------------------------------------------------------------------------------ |
    | `value`       | column name, date string, or `'now'`                                                 |
    | `add`         | amount to add - e.g. `'6M'`, `'2d 5h'`, or number (days)                             |
    | `sub`         | amount to subtract                                                                   |
    | `format`      | output format using [date symbols](#42-units-datetime). Wrap literal text in `[]`    |
    | `fromPattern` | parse a date string using this pattern (not supported by SQLite)                     |
    | `ifNull`      | provide a fallback (default) value in case the `value` gets null value from database |
    | `cast`        | same options as `str.cast`                                                           |
    | `decrypt`     | same as `str.decrypt`                                                                |
    | `as`          | output alias                                                                         |
    | `compare`     | comparator conditions on the returned value                                          |

---

- #### And / Or Wrappers <span id="and-or-wrapper">(`and`, `or`)</span>

    `and` and `or` wrappers give you explicit control over how conditions are joined inside `where` and `having`. By default all conditions in a `where` block are joined with `AND` - wrapping a group in `or` switches just that group to `OR`, and they can be nested for complex logic.

    ```javascript
    await User.find({
        where: {
            or: [
                { salary: { between: { gt: 5000, lt: 15000 } } },
                { role: '#intern' }
            ],
            status: 1
        }
    })
    // WHERE ((`salary` BETWEEN 5000 AND 15000) OR `role` = 'intern') AND `status` = 1
    ```

    Nesting works in both directions:

    ```javascript
    await User.find({
        where: {
            and: [
                { or: [{ department: '#sales' }, { department: '#marketing' }] },
                { or: [{ status: 1 }, { status: 2 }] }
            ]
        }
    })
    // SELECT * FROM USERS WHERE ((`department` = 'sales' OR `department` = 'marketing')
    // AND (`status` = 1 OR `status` = 2))
    ```

    > `and` / `or` wrappers can be nested as and when required.

---

- #### If Wrapper <span id="if-wrapper">(`if`)</span>

    Generates `IF(condition, trueValue, falseValue)` in MySQL, `CASE WHEN` in PostgreSQL/SQLite.

    ```javascript
    await User.find({
        select: [{
            if: { check: { experience: { lt: 1 } }, trueValue: '#Fresher', falseValue: '#Experienced', as: 'level' }
        }]
    })
    // SELECT IF(`experience` < 1, 'Fresher', 'Experienced') AS `level` FROM `users`
    ```

---

- #### Case Wrapper <span id="case-wrapper">(`case`)</span>

    Generates `CASE WHEN ... THEN ... ELSE ... END`. Evaluates conditions in order and returns the first matching value.

    ```javascript
    await User.find({
        select: [{
            case: {
                check: [
                    { when: { experience: { lt: 2 } }, then: '#Fresher' },
                    { when: { experience: { between: { gt: 2, lt: 5 } } }, then: '#Mid-level' }
                ],
                else: '#Senior',
                as: 'level'
            }
        }]
    })
    // SELECT CASE WHEN `experience` < 2 THEN 'Fresher'
    //             WHEN `experience` BETWEEN 2 AND 5 THEN 'Mid-level'
    //             ELSE 'Senior' END AS `level`
    // FROM `users`
    ```

---

- #### Aggregate Wrappers <span id="aggregate-wrapper">(`sum`, `avg`, `count`, `min`, `max`)</span>

    All five share the same interface. Used with `groupBy` / `having`, and in `orderBy.using`. They also support the `over` property to perform Window (Analytical) functions.

    ```javascript
    await User.find({
        select: [
            'department',
            { sum:   { value: 'salary', ifNull: 0, as: 'totalSalary' } },
            { avg:   { value: 'salary', cast: 'unsigned', as: 'avgSalary' } },
            { count: { value: '*', distinct: true, as: 'headCount' } },
            { min:   { value: 'salary', as: 'lowestSalary' } },
            { max:   { value: 'salary', as: 'highestSalary' } }
        ],
        groupBy: ['department'],
        having: { avg: { value: 'salary', compare: { gt: 50000 } } }
    })
    // SELECT `department`,
    //   SUM(COALESCE(`salary`, 0)) AS `totalSalary`,
    //   CAST(AVG(`salary`) AS UNSIGNED) AS `avgSalary`,
    //   COUNT(DISTINCT *) AS `headCount`,
    //   MIN(`salary`) AS `lowestSalary`,
    //   MAX(`salary`) AS `highestSalary`
    // FROM `users`
    // GROUP BY `department`
    // HAVING AVG(`salary`) > 50000
    ```

    | Option     | Description                                              |
    | ---------- | -------------------------------------------------------- |
    | `value`    | column name or conditional object                        |
    | `distinct` | ignore duplicate values when `true`                      |
    | `over`     | [Window Options](#window-options) for analytical queries |
    | `ifNull`   | fallback value if result is null                         |
    | `cast`     | same options as `str.cast`                               |
    | `as`       | output alias                                             |
    | `compare`  | comparator conditions on the returned value              |

---

- #### Offset Wrappers <span id="offset-wrapper">(`lead`, `lag`)</span>

    `lead` and `lag` wrappers can be used to generate allowing you to peek forward or look back at values in neighboring rows within the same result set without using join or sub-queries.

    ```javascript
    // 1. without any optional parameters
    await User2.find({
        select: ['userId', 'w.points',
            { lead: { value: 'w.points', as: 'leading' } }
        ], join: [{ table: 'user_wallet', alias: 'w', using: ['userId'] }], limit: 10
    })

  // SELECT `userId`, `w`.`points`, LEAD(`w`.`points`) OVER () AS 'leading' FROM `nitecapp_users` JOIN `nitecapp_user_wallets` `w` USING (`userID`) LIMIT 10


    // 2. with optional parameters
    await User2.find({
        select: ['userId', 'w.points',
            { lead: { value: 'w.points', offset: 1, defaultValue: 0, as: 'leading' } }
        ], join: [{ table: 'user_wallet', alias: 'w', using: ['userId'] }], limit: 10
    })

  // SELECT `userId`, `w`.`points`, LEAD(`w`.`points`, 1, 0) OVER () AS 'leading' FROM `nitecapp_users` JOIN `nitecapp_user_wallets` `w` USING (`userID`) LIMIT 10

  // 3. with ordering

  await User2.find({
    select: [
        'userId',
        'w.points',
        { lag: { value: 'w.points', over: { orderBy: { 'w.points': 'desc' } }, as: 'prev_points' } }
    ],
    join: [{ table: 'user_wallet', alias: 'w', using: ['userId'] }]
  })

  // SELECT `userId`, `w`.`points`, LAG(`w`.`points`) OVER (ORDER BY `w`.`points` DESC) AS `prev_points` FROM `users` JOIN `user_wallets` `w` USING (`userId`)
    ```

- #### Rank Wrappers <span id="rank-wrapper">(`rank`, `denseRank`, `percentRank`, `rowNum`, `nTile`)</span>

    `rank`, `denseRank`, `percentRank`, `rowNum`, `nTile` wrappers can be used to generate ranking window query to access data from other rows relative to the current row without using join or sub-queries.

    ```javascript
     await User2.find({
        select: ['userId', 'w.points',
            { rank: { over: { orderBy: { 'w.points': 'desc' } }, as: 'ranking' } }
        ], join: [{ table: 'user_wallet', alias: 'w', using: ['userId'] }], limit: 10
    })

    // SELECT `userId`, `w`.`points`, RANK() OVER (ORDER BY `w`.`points` DESC) AS 'ranking' FROM `users` JOIN `user_wallets` `w` USING (`userId`) LIMIT 10
    ```

- #### Value Wrappers <span id="value-wrapper">(`firstValue`, `lastValue`, `nthValue`)</span>

    `firstValue`, `lastValue`, `nthValue` wrappers can be used to retrieve a specific column value from a defined set of rows (the window frame) relative to the current row.

    ```javascript
     await User2.find({
        select: ['userId', 'w.points',
            { firstValue: { value:'w.points', over: { orderBy: { 'w.points': 'desc' } }, as: 'highestPoints' } }
        ], join: [{ table: 'user_wallet', alias: 'w', using: ['userId'] }], limit: 10
    })

    // SELECT `userId`, `w`.`points`, FIRST_VALUE(`w`.`points`) OVER (ORDER BY `w`.`points` DESC) AS 'first' FROM `users` JOIN `user_wallets` `w` USING (`userId`) LIMIT 10
    ```

- #### Window Options <span id="window-options">(`over`)</span>

    The `over` property, available inside all **Aggregate Wrappers**, **Offset Wrappers**, **Rank Wrappers** and **Value Rappers**, transforms them into a Window Function. It defines the *partitioning*, *ordering*, and *framing* of the operation via. `partitionBy`, `orderBy` and `frame` properties respectively.

    ```javascript
    await User.find({
        select: [
            'department',
            'salary',
            { 
                sum: { 
                    value: 'salary', 
                    over: { 
                        partitionBy: ['department'], 
                        orderBy: { salary: 'desc' },
                        frame: { unit: 'rows', start: 'unboundedPreceding', end: 'currentRow' }
                    }, 
                    as: 'runningTotal' 
                } 
            }
        ]
    })
 
    // SELECT `department`, `salary`, SUM(`salary`) OVER (PARTITION BY `department` ORDER BY `salary` DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS `runningTotal` FROM `users`
 
    ```

    | Option        | Description                                                                       |
    | :------------ | :-------------------------------------------------------------------------------- |
    | `partitionBy` | Array of column names to group the window.                                        |
    | `orderBy`     | Object mapping columns to `'asc'` or `'desc'` to define the window sort order.    |
    | `frame`       | Object defining the subset of rows (`unit`, `start`, `end`) within the partition. |

    **Frame Unit (`unit`):** `'rows'` (default), `'range'`, or `'groups'`.

    **Frame Bounds (`start` / `end`):**
    - **Keywords:** `'unboundedPreceding'`, `'currentRow'`, `'unboundedFollowing'`.
    - **Offsets:** `{ preceding: n }` or `{ following: n }`.

- #### Json Wrapper <span id="json-wrapper">(`json`)</span>

    Creates or extracts JSON objects/arrays. Supports inline values, arrays, column references, and full sub-query properties.

    ```javascript
    // Create a JSON object from a sub-query (one per user, aggregated into array)
    await User.find({
        alias: 'u',
        select: [
            'userId', 'firstName',
            {
                json: {
                    value: { orderId: 'orderId', total: 'amount', date: 'createdOn' },
                    table: 'orders',
                    where: { userId: 'u.userId' },
                    orderBy: { createdOn: 'desc' },
                    limit: 10,
                    aggregate: true, // wrap rows into array
                    as: 'recentOrders'
                }
            }
        ]
    })

    // Extract a value from a JSON column
    await User.find({
        select: [{ json: { value: 'address', extract: 'permanent.city', as: 'city' } }]
    })
    ```

    | Option            | Description                                                                                  |
    | ----------------- | -------------------------------------------------------------------------------------------- |
    | `value`           | `{}` → JSON object, string → column containing JSON                                          |
    | `table`           | sub-query source table                                                                       |
    | `extract`         | path to extract from JSON (e.g. `'address.city'` or index `0`)                               |
    | `contains`        | check if JSON contains this value                                                            |
    | `aggregate`       | when `true`, wraps multiple JSON objects into an array                                       |
    | `ifNull`          | sets a fallback value                                                                        |
    | `as`              | output alias                                                                                 |
    | Sub-query options | `alias`, `join`, `where`, `groupBy`, `having`, `orderBy`, `limit`, `offset` - same as `find` |

---

- #### Refer Wrapper <span id="refer-wrapper">(`refer`)</span>

    Generates a correlated subquery that fetches a single value from another table. Works in `select`, `where`, `having`, and `orderBy.using`.

    ```javascript
    // Fetch department name alongside each user
    await User.find({
        alias: 'u',
        select: [
            'u.userId', 'u.firstName',
            {
                refer: {
                    alias: 'd',
                    select: ['name'],
                    table: 'departments',
                    where: { deptId: 'u.departmentId' }
                }
            }
        ]
    })
    // SELECT `u`.`userId`, `u`.`firstName`,
    //   (SELECT `d`.`name` FROM `departments` `d` WHERE `d`.`deptId` = `u`.`departmentId`)
    // FROM `users` `u`
    ```

    | Option    | Description                                                                                                              |
    | --------- | ------------------------------------------------------------------------------------------------------------------------ |
    | `table`   | (required) source table                                                                                                  |
    | `alias`   | local reference name for table to be used in query                                                                       |
    | `select`  | column or any nested wrapper objects (must return single value)                                                          |
    | `join`    | array of json object(s) each one to connect a child table with parent table `using` single or set of common column(s)    |
    | `where`   | object containing various filter conditions                                                                              |
    | `groupBy` | group records based on column(s)                                                                                         |
    | `having`  | object containing various filter conditions similar to `where` clause but also supports aggregate wrappers as conditions |
    | `orderBy` | object containing sorting criteria                                                                                       |
    | `limit`   | limit the number of record(s)                                                                                            |
    | `offset`  | set starting offset                                                                                                      |
    | `cast`    | converts the datatype of the returned value                                                                              |
    | `decrypt` | object containing columns specific decryption related configs                                                            |
    | `ifNull`  | sets default fallback value in case wrapper returns null value                                                           |
    | `as`      | provide local reference name (derived column name) for the value returned by the wrapper (defaults to str)               |
    
---

- #### Concat Wrapper <span id="concat-wrapper">(`concat`)<span>

    Combines multiple values into a single string with an optional separator.

    ```javascript
    await User.find({
        select: [{
            concat: { value: ['firstName', 'lastName'], pattern: ' ', as: 'fullName' }
        }]
    })
    // SELECT CONCAT_WS(' ', `firstName`, `lastName`) AS `fullName` FROM `users`
    ```

    | Option     | Description                                       |
    | ---------- | ------------------------------------------------- |
    | `value`    | array of column names, static values, or wrappers |
    | `pattern`  | separator string between values                   |
    | `textCase` | `'upper'` \| `'lower'`                            |
    | `padding`  | same as `str.padding`                             |
    | `substr`   | same as `str.substr`                              |
    | `trim`     | same as `str.trim`                                |
    | `as`       | output alias                                      |
    | `compare`  | comparator conditions on the returned value       |

---

### 5.4 Comparator Objects

Used inside `where`, `having`, and `compare` to express conditions beyond simple equality:

|   Comparator   |          SQL (MySQL)           | Description                         |
| :------------: | :----------------------------: | ----------------------------------- |
|      `eq`      |             `= ?`              | equal to                            |
|    `notEq`     |             `!= ?`             | not equal to                        |
|      `gt`      |             `> ?`              | greater than                        |
|      `lt`      |             `< ?`              | less than                           |
|     `gtEq`     |             `>= ?`             | greater than or equal               |
|     `ltEq`     |             `<= ?`             | less than or equal                  |
|   `between`    |       `BETWEEN ? AND ?`        | range - use `gt` and `lt` as bounds |
|      `in`      |            `IN (?)`            | matches any value in list           |
|    `notIn`     |          `NOT IN (?)`          | matches none in list                |
|     `like`     |   `LIKE CONCAT("%", ?, "%")`   | contains at any position            |
|   `notLike`    | `NOT LIKE CONCAT("%", ?, "%")` | does not contain                    |
|  `startLike`   |     `LIKE CONCAT(?, "%")`      | starts with                         |
| `notStartLike` |   `NOT LIKE CONCAT(?, "%")`    | does not start with                 |
|   `endLike`    |     `LIKE CONCAT("%", ?)`      | ends with                           |
|  `notEndLike`  |   `NOT LIKE CONCAT("%", ?)`    | does not end with                   |

> PostgreSQL uses `||` concatenation instead of `CONCAT()`: e.g. `LIKE '%' || $1 || '%'`

```javascript
await User.find({
    where: {
        age:    { gtEq: 18, ltEq: 65 },
        name:   { startLike: 'John' },
        status: { notEq: 0 },
        role:   { in: ['#admin', '#moderator'] }
    }
})
// WHERE `age` >= 18 AND `age` <= 65
// AND `name` LIKE CONCAT(?, "%")
// AND `status` != 0
// AND `role` IN ('admin', 'moderator')
```

---

## 6. Session Manager

`SessionManager` groups multiple queries into a single database transaction. All queries in the session share one connection - if any step fails, the entire transaction rolls back atomically.

```javascript
import { SessionManager } from 'unsql'
import { pool } from './db'

const session = new SessionManager(pool)   // dialect defaults to 'mysql'
```

The session has four lifecycle methods:

```javascript
await session.init()        // acquire connection, begin transaction
await session.commit()      // commit - makes all changes permanent
await session.rollback()    // rollback - undoes all uncommitted changes
await session.close()       // release connection without committing
```

Both `commit()` and `rollback()` accept an optional boolean parameter. Pass `false` to keep the session open after the call (useful for partial commits in complex flows).

Once initialized, pass `session` to any query method to include it in the transaction:

```javascript
const orderResp = await Order.save({ data, session })
const itemsResp = await OrderItems.save({ data: items, session })

if (!orderResp.success || !itemsResp.success) {
    await session.rollback()
} else {
    await session.commit()
}
```

> Session Manager does not work with `rawQuery` when `methodType: 'exec'` (SQLite) or `multiQuery: true` (MySQL).

---

## 7. Examples

### 7.1 Fetch All Users

```javascript
router.get('/users', async (req, res) => {
    const response = await User.find()
    return res.json(response)
})
```

### 7.2 Fetch Single User by ID

```javascript
router.get('/users/:userId(\\d+)', async (req, res) => {
    const { userId } = req.params
    const response = await User.find({ where: { userId } })
    return res.json(response)
})
```

### 7.3 Login by Email or Mobile

```javascript
router.post('/users/login', async (req, res) => {
    const { loginId } = req.body
    const response = await User.find({
        select: ['userId', 'firstName', 'role'],
        where: { or: [{ email: `#${loginId}` }, { mobile: `#${loginId}` }] }
    })
    return res.json(response)
})
```

### 7.4 Fetch Users with Their Last 10 Orders

```javascript
router.get('/users', async (req, res) => {
    const response = await User.find({
        alias: 'u',
        select: [
            'userId', 'firstName',
            {
                json: {
                    value: { orderId: 'orderId', total: 'amount', date: 'createdOn' },
                    table: 'order_history',
                    alias:'o'
                    where: { userId: 'u.userId' },
                    orderBy: { createdOn: 'desc' },
                    limit: 10,
                    aggregate: true, // wrap orders in []
                    as: 'orders'
                }
            }
        ]
    })
    return res.json(response)
})
```

### 7.5 User Leaderboard (Sorted by Wallet Balance)

```javascript
router.get('/users/leaderboard', async (req, res) => {
    const response = await User.find({
        alias: 'u',
        select: ['userId', 'firstName'],
        orderBy: {
            using: [{
                refer: {
                    alias: 'w', select: ['points'],
                    table: 'user_wallets',
                    where: { userId: 'u.userId' }
                },
                order: 'desc'
            }]
        },
        limit: 10
    })
    return res.json(response)
})
```

### 7.6 Insert a User

```javascript
router.post('/users', async (req, res) => {
    const response = await User.save({ data: req.body })
    return res.json(response)
})
```

### 7.7 Bulk Insert Users

```javascript
router.post('/users/bulk', async (req, res) => {
    const response = await User.save({ data: req.body })  // array of objects
    return res.json(response)
})
```

### 7.8 Update a User

```javascript
router.put('/users/:userId(\\d+)', async (req, res) => {
    const { userId } = req.params
    const response = await User.save({ data: req.body, where: { userId } })
    return res.json(response)
})
```

### 7.9 Upsert a User

```javascript
router.post('/users/upsert', async (req, res) => {
    const response = await User.save({
        data: req.body,
        upsert: [
            'firstName', 'lastName', // replace column values with new (full override)
            { loginCount: { add: 1 } }, // add 1 to existing count
            { score: { add: 10, sub: 2 } } // expression based operations on existing column value
        ]
        // indexes: ['email']  ← required for PostgreSQL / SQLite
    })
    return res.json(response)
})
```

### 7.10 Delete a User

```javascript
router.delete('/users/:userId(\\d+)', async (req, res) => {
    const { userId } = req.params
    const response = await User.delete({ where: { userId } })
    return res.json(response)
})
```

### 7.11 Session Manager - Place Order

```javascript
router.post('/orders', async (req, res) => {
    const { userId } = req.params
    const session = new SessionManager(pool)

    const initResp = await session.init()
    if (!initResp.success) return res.status(400).json(initResp)

    const bucketResp  = await Bucket.find({ where: { userId }, session })
    const orderResp   = await Order.save({ data: req.body, session })
    const items       = bucketResp.result.map(item => ({ ...item, orderId: orderResp.result.insertId }))
    const itemsResp   = await OrderItems.save({ data: items, session })
    const clearBucket = await Bucket.delete({ where: { userId }, session })

    const allOk = bucketResp.success && orderResp.success && itemsResp.success && clearBucket.success
    if (!allOk) {
        await session.rollback()
        return res.status(400).json({ success: false, message: 'Error placing order' })
    }

    await session.commit()
    return res.status(201).json({ success: true, orderId: orderResp.result.insertId })
})
```

---

## 8. FAQs

### 8.1 What is the difference between plain text, a column name and a derived column?

Without a `#` prefix, UnSQL treats any string as a **column reference**. Add `#` (hashtag) as a prefix to pass a **literal string value**. Add `_` (underscore) as a prefix to pass any derived column name:

```javascript
where: { role: '#admin' }       // WHERE role = 'admin'   (plain text)
where: { role: 'parentRole' }   // WHERE role = parentRole (column reference)
orderBy: { _avgSalary: 'desc' }   // ORDER BY avgSalary DESC (derived column reference)
```

Apart from built-in keywords, `target` and `replaceWith` inside `str.replace` are always plain text and don't need `#` prefix.

### 8.2 What is the priority when `secret` / `iv` / `sha` are defined in multiple places?

From lowest to highest: `config.encryption` → query-level `encryption` → column-level `decrypt` / `encrypt`. The most specific definition wins.

### 8.3 Does a single codebase really work across all three dialects?

Yes. The same model and query code runs on MySQL, PostgreSQL, and SQLite. All dialect differences - placeholder syntax, identifier quoting, upsert clauses, encryption functions - are handled internally.

### 8.4 Are identifiers case sensitive?

PostgreSQL and SQLite treat identifiers as case sensitive by default. MySQL is case insensitive for table and column names.

### 8.5 Can UnSQL be used in serverless environments?

Yes - AWS Lambda (via Lambda layers), Vercel functions, and any other Node.js serverless runtime.

### 8.6 Can UnSQL be used for cross-platform desktop apps?

Yes - works with **ElectronJS**, typically paired with SQLite for local storage.

### 8.7 Why does my benchmark show 500–900ms for simple queries?

The benchmark timer measures the **full round-trip** to the database and back. When your app and database are in different geographic locations, network transit dominates that number - not SQL generation, which takes under 1ms. Deploying your app in the same cloud region and VPC as your database typically brings this from 500ms+ to under 5ms.

### 8.8 What happens if I chain operations on the same upsert column?

Operations within a single entry are merged into one expression: `{ score: { add: 10, sub: 2 } }` → `score = score + 10 - 2`. If the same column appears in two separate entries, the last one wins.

### 8.9 Can I use `rawQuery` with Session Manager?

Yes - pass `session` the same as any other method. It won't work when `methodType: 'exec'` (SQLite) or `multiQuery: true` (MySQL), as those modes manage connections differently.

---

### Support

![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=fff)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff)
![Yarn](https://img.shields.io/badge/Yarn-2C8EBB?logo=yarn&logoColor=fff)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=fff)
![Postgres](https://img.shields.io/badge/Postgres-%23316192.svg?logo=postgresql&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-%2307405e.svg?logo=sqlite&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?logo=express&logoColor=%2361DAFB)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![Fastify](https://img.shields.io/badge/-Fastify-000000?style=flat&logo=fastify&logoColor=white)
![Meteor.js](https://img.shields.io/badge/Meteor.js-%23d74c4c.svg?logo=meteor&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?logo=amazon-web-services&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?logo=vercel&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?logo=electron&logoColor=fff)

## Author

- [Siddharth Tiwari](https://www.linkedin.com/in/siddharth-tiwari-2775aa97)
