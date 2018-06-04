'use strict'
const store = require('./src/stores/pg')
const chalk = require('chalk')
const config = require('./config')

const main = async () => {
  console.log(chalk.yellowBright('Started cleaning raw data...'))
  await store.run(`DELETE FROM trades T1
    USING   trades T2
    WHERE   T1.id < T2.id 
    AND T1.timestamp  = T2.timestamp AND T1.type = T2.type AND T1.quantity = T2.quantity AND T1.price = T2.price; `)

  console.log(chalk.greenBright('Finished cleaning raw data.'))
}

if (!config.test) {
  main().then(async () => {
    process.exit()
  }).catch(e => {
    console.log(chalk.red('Err: Fell out of main loop'))
    console.log(e)
  })
}

module.exports = main
