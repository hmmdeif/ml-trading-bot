/* eslint-env mocha */

const config = require('../config')
config.dbName = 'bottest'
config.test = true

const assert = require('assert')
const db = require('../src/stores/pg')
const format = require('pg-format')

const createTimeseries = require('../create_timeseries')

describe('Create time series', () => {
  before(async () => {
    await db.run(`
      CREATE SEQUENCE trades_id_seq
        INCREMENT 1
        START 1
        MINVALUE 1
        MAXVALUE 9223372036854775807
        CACHE 1;
        
      CREATE TABLE trades
      (
          id bigint NOT NULL DEFAULT nextval('trades_id_seq'::regclass),
          quantity numeric,
          price numeric,
          type smallint,
          "timestamp" timestamp with time zone,
          CONSTRAINT trades_pkey PRIMARY KEY (id)
      );

      CREATE INDEX "timestamp"
          ON trades USING btree
          ("timestamp")`)
  })

  after(async () => {
    await db.run(`
      DROP INDEX "timestamp";
      DROP TABLE trades;
      DROP SEQUENCE trades_id_seq;
      `)
    await db.end()
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
  })

  afterEach(async () => {
    await db.run('DELETE FROM trades')
    await db.run('DELETE FROM timeseries3')
  })

  it('should insert the correct data for the trades', async () => {
    await createTimeseries()
    const candles = await db.find('SELECT * FROM timeseries3')

    assert.equal(candles.length, 5)
    assert.equal(candles[0].open, '8000')
    assert.equal(candles[0].volume, '5')
    assert.equal(candles[0].close, '7500')
    assert.equal(candles[0].high, '8500')
    assert.equal(candles[0].low, '7500')

    assert.equal(candles[4].open, '8000')
    assert.equal(candles[4].volume, '3.1')
    assert.equal(candles[4].close, '8500')
    assert.equal(candles[4].high, '8500')
    assert.equal(candles[4].low, '8000')
  })
})
