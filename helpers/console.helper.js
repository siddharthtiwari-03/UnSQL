const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",


    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    crimson: "\x1b[38m", // Scarlet

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
    bgGray: "\x1b[100m",
    bgCrimson: "\x1b[48m"

}


const handleQueryDebug = (debug, sql, values, prepared) => {
    if (debug === true || debug === 'benchmark-query' || debug == 'query') {
        console.log('\n')
        console.log(colors.blue, '******************************************************************', colors.reset)
        console.log(colors.cyan, '                       UnSQL Debug Query Begins', colors.reset)
        // console.log(colors.blue, '******************************************************************', colors.reset)
        console.log(colors.blue, '------------------------------------------------------------------', colors.reset)
        console.log('\n')
        console.log(colors.cyan, 'Un-prepared Query:', colors.reset, sql)
        console.log('\n')
        console.log(colors.cyan, 'Placeholder Values:', colors.reset, values)
        console.log('\n')
        console.log(colors.cyan, 'Prepared Query:', colors.reset, prepared)
        console.log('\n')
        // console.log(colors.blue, '******************************************************************', colors.reset)
        console.log(colors.blue, '------------------------------------------------------------------', colors.reset)
        console.log(colors.cyan, '                       UnSQL Debug Query Ends', colors.reset)
        console.log(colors.blue, '******************************************************************', colors.reset)
        console.log('\n')
    }
}


const handleError = (debug, error) => {
    if (debug === true || debug === 'benchmark-error' || debug == 'error') {
        console.log('\n')
        console.log(colors.red, '******************************************************************', colors.reset)
        console.log(colors.yellow, '                       UnSQL Debug Error Starts', colors.reset)
        // console.log(colors.red, '******************************************************************', colors.reset)
        console.log(colors.red, '------------------------------------------------------------------', colors.reset)
        console.log('\n')
        console.log(colors.yellow, 'Error while find execution:', colors.reset)
        if (typeof error === 'object')
            console.dir(error)
        else
            console.log(colors.red, error, colors.reset)
        console.log('\n')
        // console.log(colors.red, '******************************************************************', colors.reset)
        console.log(colors.red, '------------------------------------------------------------------', colors.reset)
        console.log(colors.yellow, '                       UnSQL Debug Error Ends', colors.reset)
        console.log(colors.red, '******************************************************************', colors.reset)
        console.log('\n')
    }
}

module.exports = { colors, handleQueryDebug, handleError }