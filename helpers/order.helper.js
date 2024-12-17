const { orderDirections, checkConstants } = require("./constants.helper")
const { prepareName } = require("./name.helper")
const { patchToArray } = require("./patch.helper")
const { preparePlaceholder } = require("./placeholder.helper")

const prepareOrders = ({ alias, orderBy }) => {

    console.group('prepare orders invoked')

    console.log('orderBy')
    console.dir(orderBy)

    const values = []

    const orders = orderBy.map(order => {
        const [[col, dir]] = Object.entries(order)
        console.log('col', col)
        console.log('dir', dir)
        const name = prepareName({ alias, value: col })
        const sql = ' ?? ' + orderDirections[dir]
        patchToArray(values, !checkConstants(col), name)
        return sql
    })

    console.log('prepare order ends successfully!')
    console.groupEnd()

    return { sql: orders.join(', '), values }
}

module.exports = { prepareOrders }