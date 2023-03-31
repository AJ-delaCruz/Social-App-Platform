import pg from 'pg';

const { Client } = pg;

const pgdb = new Client({
  user: 'root',
  host: 'localhost',
  database: 'socialdb',
  password: 'password',
  port: 5432,
});

export { pgdb };
