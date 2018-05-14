'use strict'
const store = require('../stores/pg')

module.exports = async (candleSize) => {
  await store.run(`
    DROP TABLE IF EXISTS timeseries${candleSize};
    
    CREATE SEQUENCE IF NOT EXISTS timeseries${candleSize}_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;
    
    CREATE TABLE timeseries${candleSize} 
    (
      id bigint NOT NULL DEFAULT nextval('timeseries${candleSize}_id_seq'),
      open numeric,
      close numeric,
      volume numeric,
      high numeric,
      low numeric,
      start timestamp with time zone
    )`)
}
