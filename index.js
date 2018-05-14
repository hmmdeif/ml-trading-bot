// 'use strict'
// const EventEmitter = require('events')
// const Pusher = require('pusher-client')
// // const store = require('./src/stores/pg')

// let topBid = 0
// let topAsk = 0

// const tradeEmitter = new EventEmitter()

// tradeEmitter.on('quote', (bid, ask) => {
//   topBid = bid
//   topAsk = ask

//   console.log(topBid)
//   console.log(topAsk)
// })

// const pusher = new Pusher('de504dc5763aeef9ff52')
// const orderBook = pusher.subscribe('order_book')

// orderBook.bind('live_trades', async data => {
//   await store.run('INSERT INTO trades (quantity, price, type, timestamp) VALUES ($1, $2, $3, $4)', [data.amount, data.price, data.type, data.timestamp])
// })
