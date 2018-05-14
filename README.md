# Deif's ML Trading Bot

## Prerequisites

* Postgresql v9.5+ (uses `IF NOT EXISTS` for sequences)
* Node v8+ (uses `async/await`)

## Node install

```bash
npm install
```

Create a .env file with the settings for the environment into which you are deploying the application. You can use the .env-sample file as a starting point:

```bash
cp .env-sample .env
```

Change the settings in the .env file to match your postgres configuration.

## Start dumping live trades from Bitstamp

Leave running forever to collect a continuous stream of trades:

```bash
npm run gather
```

## Convert live trade data into candle data

Default candle size is 3 minutes. Can be changed in `create_timeseries.js`.

```bash
npm run create-data
```

## Tests

Run unit tests:

```bash
npm run test
```

