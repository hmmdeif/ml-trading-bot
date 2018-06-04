/* eslint-env mocha */

const config = require('../config')
config.dbName = 'bottest'
config.test = true

const assert = require('assert')
const db = require('../src/stores/pg')
const createTradesTable = require('../src/gather/createTradesTable')
const format = require('pg-format')

const createTimeseries = require('../create_timeseries')
const addBB = require('../src/timeseries/addBB')

describe('Add bb', () => {
  before(async () => {
    await createTradesTable()
  })

  after(async () => {
    await db.run(`
      DROP INDEX "timestamp";
      DROP TABLE trades;
      DROP SEQUENCE trades_id_seq;
      `)
  })

  beforeEach(async () => {
    let firstDate = new Date()
    let secondDate = new Date()
    secondDate.setUTCMinutes(secondDate.getUTCMinutes() + 3)
    let thirdDate = new Date()
    thirdDate.setUTCMinutes(thirdDate.getUTCMinutes() + 6)
    let fourthDate = new Date()
    fourthDate.setUTCMinutes(fourthDate.getUTCMinutes() + 9)
    let fifthDate = new Date()
    fifthDate.setUTCMinutes(fifthDate.getUTCMinutes() + 12)
    let sixthDate = new Date()
    sixthDate.setUTCMinutes(sixthDate.getUTCMinutes() + 15)

    const values = [[1, 8000, 0, firstDate], [2, 8500, 1, secondDate], [2, 7500, 0, thirdDate],
      [1, 9000, 0, fourthDate], [2, 9200, 1, fourthDate], [5, 8800, 0, fifthDate],
      [2.1, 8000, 0, fifthDate], [1, 8500, 0, sixthDate]]

    await db.run(format('INSERT INTO trades (quantity, price, type, timestamp) VALUES %L', values))
    await createTimeseries(3)
  })

  afterEach(async () => {
    await db.run('DELETE FROM trades')
    await db.run('DELETE FROM timeseries3')
  })

  it('should update the newest candles with values', async () => {
    await addBB(3, 3)
    const candles = await db.find('SELECT * FROM timeseries3')

    assert.equal(candles.length, 6)
    console.log(candles)
    assert.equal(candles[0].bbtop, null) // first 3 periods ignored
    assert.equal(candles[1].bbtop, null)
    assert.equal(candles[2].bbtop, null)
    assert.equal(candles[3].bbtop, '8816.49658092772')
    assert.equal(candles[4].bbtop, '9795.229969097076')
    assert.equal(candles[3].bbmiddle, '8000')
    assert.equal(candles[4].bbmiddle, '8400')
    assert.equal(candles[3].bbbottom, '7183.50341907228')
    assert.equal(candles[4].bbbottom, '7004.770030902924')
  })
})
