import pg from 'pg';
import { Client } from 'cassandra-driver';
import Redis from 'ioredis';

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
// Redis database connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

export { pgDb, cassandra, redis };
