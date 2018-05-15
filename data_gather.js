'use strict'
const Pusher = require('pusher-client')
const store = require('./src/stores/pg')
const createTradesTable = require('./src/gather/createTradesTable')
const chalk = require('chalk')

const main = async () => {
  await createTradesTable()
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
