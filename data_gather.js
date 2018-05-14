'use strict'
const Pusher = require('pusher-client')
const store = require('./src/stores/pg')
const chalk = require('chalk')

const main = async () => {
  await store.run(`
    CREATE SEQUENCE IF NOT EXISTS trades_id_seq
      INCREMENT 1
      START 1
      MINVALUE 1
      MAXVALUE 9223372036854775807
      CACHE 1;
      
    CREATE TABLE IF NOT EXISTS trades
    (
        id bigint NOT NULL DEFAULT nextval('trades_id_seq'::regclass),
        quantity numeric,
        price numeric,
        type smallint,
        "timestamp" timestamp with time zone,
        CONSTRAINT trades_pkey PRIMARY KEY (id)
    );

    CREATE INDEX IF NOT EXISTS "timestamp"
        ON trades USING btree
        ("timestamp")`)

  const pusher = new Pusher('de504dc5763aeef9ff52')
  const orderBook = pusher.subscribe('live_trades')

  orderBook.bind('trade', async data => {
    await store.run('INSERT INTO trades (quantity, price, type, timestamp) VALUES ($1, $2, $3, $4)', [parseFloat(data.amount), parseFloat(data.price), parseInt(data.type), new Date(parseInt(data.timestamp) * 1000)])
    console.log(chalk.white(data.type === 0 ? chalk.green('Bought') : chalk.red('Sold'), ` ${data.amount} BTC @ $${data.price}`))
  })
}

main().then(() => {
  console.log(chalk.white('Listening for trades on Bitstamp...'))
}).catch((e) => {
  console.log(chalk.red('Err: Fell out of main loop'))
  console.log(e)
})
