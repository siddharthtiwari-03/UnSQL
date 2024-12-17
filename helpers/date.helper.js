const { colors } = require("./console.helper")
const { checkConstants, dateUnits, dateFunctions } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchInline, patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareDateFunctions = ({ alias, key, value, cb = null }) => {

    console.group(colors.blue, 'prepare date functions invoked', colors.reset)

    let sql = ''
    const values = []

    console.log('alias', alias)
    console.log('key', key)
    console.log('value', value)
    console.log('cb', cb)


    switch (true) {

        case checkConstants(key): {
            sql += dateFunctions[key] + '()'

            if (typeof value === 'object') {
                sql += patchInline(value?.add, ' + ?') + patchInline(value?.sub, ' - ?')
                patchToArray(values, value?.add, value?.add)
                patchToArray(values, value?.sub, value?.sub)
                sql += patchInline(value?.as, ' AS ? ')
                patchToArray(values, value?.as, value?.as)
            } else {
                sql += patchInline(value, ' AS ? ')
                patchToArray(values, value, value)
            }

            break
        }

        case key === 'timeDiff':
        case key === 'dateDiff': {

            if (!Array.isArray(value?.value)) {
                console.error(colors.red, 'timeDiff method expects array as value,', typeof value?.value, 'value provided, this will be ignored', colors.reset)
                break
            }
            if (value.value.length != 2) {
                console.error(colors.red, 'timeDiff method expects array with exactly 2 values,', (value?.value?.length.toString()), 'values provided, this will be ignored', colors.reset)
                break
            }

            const sq = value.value.map(dates => {
                const name = prepareName({ alias, value: dates })
                const placeholder = preparePlaceholder(dates)
                patchToArray(values, !checkConstants(dates), name)
                return placeholder
            }).join(', ')

            sql += patchInline(sq, dateFunctions[key] + '(' + sq + ')') + patchInline(value.as, ' AS ? ')
            patchToArray(values, value.as, value.as)
            break
        }

        case key === 'strToDate':
        case key === 'timeFormat':
        case key === 'dateFormat': {
            console.log(colors.red, 'dateFormat detected', colors.reset)
            console.log('key', key, 'value', value)

            sql += dateFunctions[key] + '('

            if (typeof value?.value === 'object') {
                console.log('value of date value is object')
                const [[k, v]] = Object.entries(value?.value)
                console.log('k', k)
                console.log('v', v)
                delete v['as']
                if (k in dateFunctions) {

                    const resp = prepareDateFunctions({ alias, key: k, value: v })

                    sql += patchInline(resp.sql, resp.sql)
                    patchToArray(values, resp?.values, resp?.values)
                }

            } else {
                const name = prepareName({ alias, value: value?.value })
                const placeholder = preparePlaceholder(value?.value)
                sql += placeholder
                patchToArray(values, !checkConstants(value?.value), name)
            }

            sql += patchInline(value?.format, ', ?') + ')' + patchInline(value?.as, ' AS ? ')
            patchToArray(values, value?.format, value?.format)
            patchToArray(values, value?.as, value?.as)
            break
        }

        case key === 'addDate':
        case key === 'subDate': {
            if (!('days' in value) && !('interval' in value)) {
                console.error(colors.red, key, 'method expects either "days" or ("interval" and "unit") field(s)', colors.reset)
                break
            }

            const name = prepareName({ alias, value: value?.value })
            const placeholder = preparePlaceholder(value?.value)

            sql += dateFunctions[key] + '(' + placeholder

            if ('days' in value) {
                sql += ', ?)'
                patchToArray(values, !checkConstants(value?.value), name)
                values.push(value.days)
            }

            if ('interval' in value) {
                if (!parseInt(value?.interval)) {
                    console.error(colors.red, key, 'method expects either positive or negative numeric values only for "interval" field', colors.reset)
                    break
                }
                if (!(value?.unit in dateUnits)) {
                    console.error(colors.red, key, 'method expects "unit" field to be any of these:', Object.keys(dateUnits).map(u => `'${u}'`).join(', '), 'only', colors.reset)
                    break
                }
                sql += `, INTERVAL ? ${dateUnits[value?.unit]})`
                values.push(value?.interval)
            }

            sql += patchInline(value?.as, ' AS ? ')
            patchToArray(values, value?.as, value?.as)
            break
        }

        default: {
            const name = prepareName({ alias, value: value?.value })
            const placeholder = preparePlaceholder(value?.value)
            sql += dateFunctions[key] + '(' + placeholder + ')' + patchInline(value?.as, ' AS ? ')
            values.push(name)
            patchToArray(values, value?.as, value?.as)
            break
        }

    }

    console.groupEnd()

    return { sql, values }

}

const prepareDate = ({ alias, key, value }) => {

    console.group('prepare date invoked')

    console.log('key', key)
    console.log('value', value)

    let sql = ''
    const values = []

    const { value: v, add, sub, addDays, pattern, offset, default: def, over, window, format, as } = value

    // const interval = patchInline(add, add?.match(/\d+/g)) || patchInline(sub, sub?.match(/\d+/g)) || null
    const interval = patchInline(add, parseFloat(add)) || patchInline(sub, parseFloat(sub)) || null
    const unit = patchInline(add, typeof add === 'string' && add?.match(/[a-z]+/ig)) || patchInline(sub, typeof sub === 'string' && sub?.match(/[a-z]+/ig)) || null

    console.log('interval', interval)
    console.log('unit', unit)

    const name = prepareName({ alias, value: v })
    console.log('name', name)
    const placeholder = preparePlaceholder(v)
    console.log('placeholder', placeholder)

    // add / subtract date method start here
    sql += patchInline(add || (add && key === 'addDate'), 'ADDDATE(')
    sql += patchInline(sub || (sub && key === 'subDate'), 'SUBDATE(')

    // add / subtract time method start here
    sql += patchInline(add && key === 'addTime', 'ADDTIME(')
    sql += patchInline(sub && key === 'subTime', 'SUBTIME(')

    // wrap date to date_format function if 'format' provided
    sql += patchInline(format && (key === 'time' || key === 'timeFormat'), 'TIME_FORMAT(')
    sql += patchInline(format && (key != 'time' || key === 'dateFormat'), 'DATE_FORMAT(')

    switch (true) {

        case checkConstants(key): {
            console.log('key is date constant function')
            sql += dateFunctions[key] + '()'
            break
        }

        case key === 'strToDate': {
            sql += dateFunctions[key] + '(' + placeholder + ', ?)'
            values.push(name)
            values.push(pattern)
            break
        }

        case key === 'addDate':
        case key === 'subDate':
        case key === 'dateFormat':
        case key === 'timeFormat': {
            console.log('date time formatter detected', key)
            sql += placeholder
            patchToArray(values, !checkConstants(v), name)
            break
        }

        case key === 'dateDiff':
        case key === 'timeDiff': {
            console.log('date / time difference')
            if (Array.isArray(v)) {
                const [startDate, endDate] = v

                const startName = prepareName({ alias, value: startDate })
                const endName = prepareName({ alias, value: endDate })

                const startPlaceholder = preparePlaceholder(startDate)
                const endPlaceholder = preparePlaceholder(endDate)

                sql += dateFunctions[key] + '(' + startPlaceholder + ', ' + endPlaceholder + ')'

                patchToArray(values, !checkConstants(startDate), startName)
                patchToArray(values, !checkConstants(endDate), endName)

            } else {
                console.error(colors.red, key, 'expects value to be an array,', typeof key, 'type value provided, this method will be ignored', colors.reset)
            }
            break
        }

        case key === 'least': {
            sql += 'LEAST('
            sql += v.map(val => {
                const n = prepareName({ alias, value: val })
                const placeholder = preparePlaceholder(val)
                patchToArray(values, !checkConstants(val), n)
                return placeholder
            })
            sql += ')'
            break
        }

        case key === 'lead':
        case key === 'lag': {
            console.log('lead / lag detected')

            sql += dateFunctions[key] + '(' + placeholder + ')'
            patchToArray(values, !checkConstants(v), name)

            sql += ' OVER ('

            if (typeof window === 'object') {

                const { orderBy } = window

                sql

            } else if (window) {
                sql += ' ?? '
                values.push(window)
            }

            sql += ')'

            break
        }

        default: {
            console.log('default date function')

            sql += dateFunctions[key] + '(' + placeholder + ')'

            patchToArray(values, !checkConstants(v), name)
            break
        }

    }

    // patch format
    sql += patchInline(format, ', ?)')
    patchToArray(values, format, format)

    // patching if only interval is provided
    sql += patchInline(interval && !unit, ', ?')

    // patch if interval and unit both are provided
    sql += patchInline(interval && unit, ', INTERVAL ? ')
    patchToArray(values, interval, interval)

    // patch unit
    sql += patchInline(unit, dateUnits[unit])

    // add / subtract date / time method start here
    sql += patchInline(add || sub || key === 'addDate' || key === 'subDate' || key === 'addTime' || key === 'subTime', ')')

    // patch local name here
    sql += patchInline(sql != '', ' AS ?')
    patchToArray(values, sql != '', patchInline(as, as, patchInline(v.includes('.'), v.split('.')[1], v)))

    console.groupEnd()

    return { sql, values }

}

module.exports = { prepareDateFunctions, prepareDate }