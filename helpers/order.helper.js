const { checkConstants } = require("./constants.helper")
const { prepName } = require("./name.helper")


const orderDirections = {
    asc: 'ASC',
    desc: 'DESC'
}

const prepOrders = ({ alias, orderBy }) => {
    const values = []
    const sql = Object.entries(orderBy).map(([col, dir]) => {
        const name = prepName({ alias, value: col })
        const sql = ' ?? ' + orderDirections[dir]
        if (!checkConstants(col)) values.push(name)
        return sql
    }).join(', ')

    return { sql, values }
}

module.exports = { prepOrders }