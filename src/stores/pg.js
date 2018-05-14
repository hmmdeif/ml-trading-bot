'use strict'
const { Pool } = require('pg')
const config = require('../../config')

const pool = new Pool({
  user: config.dbUsername,
  host: config.dbHost,
  database: config.dbName,
  password: config.dbPassword,
  port: config.dbPort
})

pool.on('error', err => {
  console.log('PG error', err)
})

const find = async (query, params, ignoreError) => {
  const client = await pool.connect()
  let rows = []
  try {
    const res = await client.query(query, params)
    rows = res.rows
  } catch (e) {
    rows = null
    if (!ignoreError) {
      console.log(e)
    }
  } finally {
    client.release()
  }
  return rows
}

const findOne = async (query, params, ignoreError) => {
  const client = await pool.connect()
  let row = {}
  try {
    const res = await client.query(query, params)
    row = res.rows[0]
  } catch (e) {
    row = null
    if (!ignoreError) {
      console.log(e)
    }
  } finally {
    client.release()
  }
  return row
}

const run = async (statement, params) => {
  const client = await pool.connect()
  let result
  try {
    result = await client.query(statement, params)
  } catch (e) {
    result = null
    console.log(e)
  } finally {
    client.release()
  }
  return result
}

const runTransaction = async (statementParamArray) => {
  const client = await pool.connect()
  let result
  try {
    await client.query('BEGIN')
    for (const statementParam of statementParamArray) {
      await client.query(statementParam.statement, statementParam.params)
    }
    result = await client.query('COMMIT')
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch (ohgod) {
      console.log(ohgod)
    }
    result = null
    console.log(e)
  } finally {
    client.release()
  }
  return result
}

const beginTransaction = async () => {
  const client = await pool.connect()
  await client.query('BEGIN')
  return client
}

const runPartialTransaction = (client, statement, params) => {
  return client.query(statement, params)
}

const commitTransaction = (client) => {
  return client.query('COMMIT')
}

const rollbackTransaction = (client) => {
  return client.query('ROLLBACK')
}

const end = () => pool.end()

module.exports = {
  find: find,
  findOne: findOne,
  run: run,
  runTransaction: runTransaction,
  beginTransaction: beginTransaction,
  runPartialTransaction: runPartialTransaction,
  commitTransaction: commitTransaction,
  rollbackTransaction: rollbackTransaction,
  end: end
}
