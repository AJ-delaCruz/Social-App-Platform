import pg from 'pg';
import { Client } from 'cassandra-driver';
import Redis from 'ioredis';

// PostgreSQL database connection
const pgDb = new pg.Client({
  user: process.env.PG_USER || 'ajay',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'socialdb',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
});

// Cassandra database connection
const cassandra = new Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINT || '127.0.0.1'],
  localDataCenter: process.env.CASSANDRA_DATA_CENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'social_media',
});
// Redis database connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

export { pgDb, cassandra, redis };
