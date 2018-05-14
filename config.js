const dotenv = require('dotenv')

dotenv.config({silent: true})

const config = {
  nodeEnv: process.env.NODE_ENV,
  nodeHost: process.env.HOST,
  nodePort: process.env.PORT,
  dbHost: process.env.DBHOST,
  dbPort: process.env.DBPORT,
  dbName: process.env.DBNAME,
  dbUsername: process.env.DBUSER,
  dbPassword: process.env.DBPASSWORD
}

module.exports = config
