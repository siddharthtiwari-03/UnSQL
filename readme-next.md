# UnSQL

UnSQL is an open source library, written in JavaScript, that provides class based clean and modern interface, while facilitating dynamic query generation under the hood, to interact with structured Database (MySQL). UnSQL is compatible with JavaScript based runtimes like Node.js and Next.js.

## Breaking Changes

Beyond the version v2+ backward compatibility has been dropped, from the default import, in favour of security. For projects still running on version v1.x we recommend switching to the existing import/require with legacy flag `unsql/legacy`

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
- JSDoc type compatibility for type checking and code suggestion

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

UnSQL is class based, therefore the first step is to create model class for each table in the database. Each of these classes must extend from the UnSQL base class. Then this model class can be used to perform desired operations via. different methods provided.

UnSQL provides three (03) methods, to perform the **CRUD** operations using these model classes. Each of these methods accepts object as their parameter with various properties.

|    Method     |                                       Description                                     |
|---------------|---------------------------------------------------------------------------------------|
| **`find`**    | (static method) used to fetch records from the database table                         |
| **`save`**    | (static method) used to insert / update / upsert record(s) in the database table      |
| **`delete`**  | (static method) used to remove record(s) from the database table                      |

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
        pool, // (optional) either mysql 'pool' or 'connection' property is required
        // connection, // (optional) either mysql 'pool' or 'connection' property is required
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
        table: 'replace_with_user_table_name',
        pool,
        safeMode: true
    }

}
```

### What is config inside UnSQL model class?

**config** is a _static_ object that is used to define the configurations related to that specific model class. Below are the list of properties **config** object accepts:
- **table**: (mandatory) accepts name of the table in the database,
- **pool**: (optional) accepts mysql connection pool object,
- **connection**: (optional) accepts mysql connection object
- **safeMode**: (optional) accepts boolean value, helps avoiding accidental delete of all method without 'where' property, default 'true'

> Please note: value for either or the two: **pool** or **connection** property must provided. **pool** takes priority over **connection** in case value for both are provided

## Author

- [Siddharth Tiwari](https://www.linkedin.com/in/siddharth-tiwari-2775aa97)