'use strict'
const store = require('./src/stores/pg')
const chalk = require('chalk')
const createTable = require('./src/timeseries/createTable')
const insertCandle = require('./src/timeseries/insertCandle')
const config = require('./config')
const addRSI = require('./src/timeseries/addRSI')

const findFirstCandle = (candleSize, timestamp) => {
  let start = new Date(timestamp.valueOf())
  start.setUTCHours(0)
  start.setUTCMinutes(0)
  start.setUTCSeconds(0)
  start.setUTCMilliseconds(0)
  let candleStart

  while (timestamp > start) { // eslint-disable-line
    candleStart = new Date(start.valueOf())
    start.setUTCMinutes(start.getUTCMinutes() + candleSize)
  }

  return candleStart
}

const resetCandle = (start) => {
  return { open: 0, close: 0, volume: 0, high: 0, low: 0, start: new Date(start.valueOf()) }
}

const main = async (candleSize) => {
  const limit = 1000
  const unixStart = new Date(0)
  let results = []
  let startingTimestamp = new Date(0)
  let candle = resetCandle(startingTimestamp)
  await createTable(candleSize)
  let totalCandlesMade = 0
  console.log(chalk.yellowBright('Created time series table for the'), chalk.white.bold(candleSize), chalk.yellowBright('minute candle.'))

  while ((results.length === limit && startingTimestamp > unixStart) || startingTimestamp.valueOf() === unixStart.valueOf()) {
    results = await store.find('SELECT * FROM trades WHERE timestamp > $1 ORDER BY timestamp LIMIT $2', [startingTimestamp, limit])

    for (const trade of results) {
      const t = new Date(trade.timestamp)

      if (startingTimestamp.valueOf() === unixStart.valueOf()) {
        candle.start = findFirstCandle(candleSize, t)
        candle.open = trade.price
      }

      if (candle.start < t) {
        let end = new Date(candle.start.valueOf())
        end.setUTCMinutes(end.getUTCMinutes() + candleSize)

        if (t > end) {
          await insertCandle(candle, candleSize)
          ++totalCandlesMade
          candle = resetCandle(candle.start)
          candle.start.setUTCMinutes(candle.start.getUTCMinutes() + candleSize)

          let newEnd = new Date(candle.start.valueOf())
          newEnd.setUTCMinutes(newEnd.getUTCMinutes() + candleSize)

          while (t > newEnd) { // eslint-disable-line
            await insertCandle(candle, candleSize)
            ++totalCandlesMade
            candle = resetCandle(candle.start)
            candle.start.setUTCMinutes(candle.start.getUTCMinutes() + candleSize)
            newEnd.setUTCMinutes(newEnd.getUTCMinutes() + candleSize)
          }

          candle.open = trade.price
        }

        candle.close = trade.price

        if (candle.high < trade.price) {
          candle.high = trade.price
        }

        if (candle.low > trade.price || candle.low === 0) {
          candle.low = trade.price
        }

        candle.volume += parseFloat(trade.quantity)
      }

      if (t > startingTimestamp) {
        startingTimestamp = new Date(t.valueOf())
      }
    }
  }

  await insertCandle(candle, candleSize)
  ++totalCandlesMade

  console.log(chalk.greenBright('Finished generating candles.'), chalk.white.bold(totalCandlesMade), chalk.greenBright('candles have been made.'))
}

if (!config.test) {
  const candleSize = 3
  main(candleSize).then(async () => {
    await addRSI(candleSize, 13)
    process.exit()
  }).catch(e => {
    console.log(chalk.red('Err: Fell out of main loop'))
    console.log(e)
  })
}

module.exports = main
