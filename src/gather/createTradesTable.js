'use strict'
const store = require('../stores/pg')

module.exports = async () => {
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
}
