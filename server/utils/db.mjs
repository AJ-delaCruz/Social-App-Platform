import pg from 'pg';
const { Client } = pg;

export const pgdb = new Client({
    user: 'root',
    host: 'localhost',
    database: 'socialdb',
    password: 'password',
    port: 5432,
});