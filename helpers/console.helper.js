const colors = Object.freeze({
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
})


const handleQueryDebug = (debug, sql, values, prepared = null) => {
    if (debug === true || debug === 'benchmark-query' || debug == 'query') {
        console.info('\n')
        console.info(colors.blue, '******************************************************************', colors.reset)
        console.info(colors.cyan, '                       UnSQL Debug Query Begins', colors.reset)
        console.info(colors.blue, '------------------------------------------------------------------', colors.reset)
        console.info('\n')
        console.info(colors.cyan, 'Un-prepared Query:', colors.reset, sql)
        console.info('\n')
        console.info(colors.cyan, 'Placeholder Values:', colors.reset, values)
        console.info('\n')
        if (prepared) {
            console.info(colors.cyan, 'Prepared Query:', colors.reset, prepared)
            console.info('\n')
        }
        console.info(colors.blue, '------------------------------------------------------------------', colors.reset)
        console.info(colors.cyan, '                       UnSQL Debug Query Ends', colors.reset)
        console.info(colors.blue, '******************************************************************', colors.reset)
    }
}


const handleError = (debug, error) => {
    if (debug === true || debug === 'benchmark-error' || debug == 'error') {
        console.error('\n')
        console.error(colors.red, '******************************************************************', colors.reset)
        console.error(colors.yellow, '                       UnSQL Debug Error Starts', colors.reset)
        console.error(colors.red, '------------------------------------------------------------------', colors.reset)
        console.error('\n')
        console.error(colors.yellow, 'Error while find execution:', colors.reset)
        if (typeof error === 'object')
            console.dir(error)
        else
            console.error(colors.red, error, colors.reset)
        console.error('\n')
        console.error(colors.red, '------------------------------------------------------------------', colors.reset)
        console.error(colors.yellow, '                       UnSQL Debug Error Ends', colors.reset)
        console.error(colors.red, '******************************************************************', colors.reset)
    }
}

module.exports = { colors, handleQueryDebug, handleError }