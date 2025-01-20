const { checkConstants } = require("./constants.helper")
const { prepareName } = require("./name.helper")


const orderDirections = {
    asc: 'ASC',
    desc: 'DESC'
}

const prepOrders = ({ alias, orderBy }) => {

    console.log('prepare orders invoked')

    const values = []

    const sql = Object.entries(orderBy).map(([col, dir]) => {
        const name = prepareName({ alias, value: col })
        const sql = ' ?? ' + orderDirections[dir]
        if (!checkConstants(col)) values.push(name)
        return sql
    }).join(', ')

    return { sql, values }
}

module.exports = { prepOrders }