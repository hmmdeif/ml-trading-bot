/* eslint-env mocha */

const config = require('../config')
config.dbName = 'bottest'
config.test = true

const assert = require('assert')
const db = require('../src/stores/pg')
const createTradesTable = require('../src/gather/createTradesTable')
const format = require('pg-format')

const createTimeseries = require('../create_timeseries')
const addRSI = require('../src/timeseries/addRSI')

describe('Add rsi', () => {
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
    thirdDate.setUTCMinutes(thirdDate.getUTCMinutes() + 12)

    const values = [[1, 8000, 0, firstDate], [2, 8500, 1, firstDate], [2, 7500, 0, firstDate],
      [1, 9000, 0, secondDate], [2, 9200, 1, secondDate], [5, 8800, 0, secondDate],
      [2.1, 8000, 0, thirdDate], [1, 8500, 0, thirdDate]]

    await db.run(format('INSERT INTO trades (quantity, price, type, timestamp) VALUES %L', values))
    await createTimeseries(3)
  })

  afterEach(async () => {
    await db.run('DELETE FROM trades')
    await db.run('DELETE FROM timeseries3')
  })

  it('should update the newest candles with values', async () => {
    await addRSI(3, 2)
    const candles = await db.find('SELECT * FROM timeseries3')

    assert.equal(candles.length, 5)
    assert.equal(candles[0].rsi, null) // first 2 periods ignored
    assert.equal(candles[1].rsi, null)
    assert.equal(candles[2].rsi, '12.871287128712872') // low strength as empty candles
    assert.equal(candles[3].rsi, '12.871287128712872')
    assert.equal(candles[4].rsi, '80.04535147392289') // high strength because closed up from zero
  })

  it('should update the candles correctly with different periods', async () => {
    await addRSI(3, 3)
    const candles = await db.find('SELECT * FROM timeseries3')

    assert.equal(candles.length, 5)
    assert.equal(candles[0].rsi, null) // first 3 periods ignored
    assert.equal(candles[1].rsi, null)
    assert.equal(candles[2].rsi, null)
    assert.equal(candles[3].rsi, '12.871287128712869')
    assert.equal(candles[4].rsi, '61.48796498905909') // high strength because closed up from zero
  })
})
