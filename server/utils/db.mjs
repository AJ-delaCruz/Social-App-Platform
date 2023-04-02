import pg from 'pg';
import { Client } from 'cassandra-driver';

// PostgreSQL database connection
const pgDb = new pg.Client({
  user: 'root',
  host: 'localhost',
  database: 'socialdb',
  password: 'password',
  port: 5432,
});

// Cassandra database connection
const cassandra = new Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'social_media',
});

export { pgDb, cassandra };
