'use strict'
const store = require('../stores/pg')
const tulind = require('tulind')
const { promisify } = require('util')

const rsi = promisify(tulind.indicators.rsi.indicator).bind(tulind.indicators.rsi)

module.exports = async (candleSize, period) => {
  await store.run(`ALTER TABLE timeseries${candleSize} ADD COLUMN rsi numeric`)

  const limit = 200
  let results = []
  let offset = 0

  while ((results.length === limit && offset > 0) || offset === 0) {
    results = await store.find(`SELECT id, close FROM timeseries${candleSize} ORDER BY start OFFSET $1 LIMIT $2`, [offset, limit])
    let closes = []

    for (const result of results) {
      closes.push(result.close)
    }

    const rsiResults = await rsi([closes], [period])
    let i = 0
    for (const result of results) {
      if (i >= period) {
        await store.run(`UPDATE timeseries${candleSize} SET rsi = $1 WHERE id = $2`, [rsiResults[0][i - period], result.id])
      }
      ++i
    }

    offset += limit - period
  }

  // console.log(tulind.indicators.rsi)
}
