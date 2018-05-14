'use strict'
const store = require('../stores/pg')

module.exports = async (candle, candleSize) => {
  await store.run(`INSERT INTO timeseries${candleSize} (open, close, volume, high, low, start) VALUES ($1, $2, $3, $4, $5, $6)`,
    [candle.open, candle.close, candle.volume, candle.high, candle.low, candle.start])
}
