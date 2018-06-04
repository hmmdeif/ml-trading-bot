'use strict'
const store = require('../stores/pg')
const tulind = require('tulind')
const { promisify } = require('util')

const bband = promisify(tulind.indicators.bbands.indicator).bind(tulind.indicators.bbands)

module.exports = async (candleSize, period) => {
  await store.run(`ALTER TABLE timeseries${candleSize} ADD COLUMN bbtop numeric, ADD COLUMN bbbottom numeric, ADD COLUMN bbmiddle numeric`)

  const limit = 200
  let results = []
  let offset = 0

  while ((results.length === limit && offset > 0) || offset === 0) {
    results = await store.find(`SELECT id, close FROM timeseries${candleSize} ORDER BY start OFFSET $1 LIMIT $2`, [offset, limit])
    let closes = []

    for (const result of results) {
      closes.push(result.close)
    }

    const bbResults = await bband([closes], [period, 2])
    let i = 0
    for (const result of results) {
      if (i >= period) {
        await store.run(`UPDATE timeseries${candleSize} SET bbtop = $1, bbbottom = $2, bbmiddle = $3 WHERE id = $4`, [bbResults[2][i - period], bbResults[0][i - period], bbResults[1][i - period], result.id])
      }
      ++i
    }

    offset += limit - period
  }

  // console.log(tulind.indicators.bbands)
}
