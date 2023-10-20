import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools'; // needed for subscription to work
import typeDefs from './schema/typeDefs.mjs';
import resolvers from './schema/resolvers.mjs';
import { pgDb, cassandra, redis } from './utils/db.mjs';
import { checkAuth } from './utils/passport.mjs';
import { kafka, producer } from './kafka-server/kafkaClient.mjs';
import kafkaConsumer from './kafka-server/kafkaConsumer.mjs';

import postAPI from './test/RestAPI/post.mjs';

dotenv.config();

const port = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true })); // parse req.body with URL-encoded format by client
app.use(express.json()); // parse request bodies that are in JSON format

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
// Connect to Postgres
pgDb.connect((err) => {
  if (err) throw err;
  console.log('Connected to Postgres');
});
// Connect to Cassandra
cassandra.connect((err) => {
  if (err) throw err;
  console.log('Connected to Cassandra cluster');
});
redis.on('ready', () => {
  console.log('Connected to Redis');
});
// Authenticate all requests to the /graphql endpoint using the checkAuth middleware
// app.use('/graphql', checkAuth); // comment out for testing playgroubd without authentication

// Create an instance of Apollo Server
const server = new ApolloServer({
  schema, // Use the combined schema

  context: ({ req }) => ({
    pgDb,
    cassandra,
    redis, // add Redis client to the context
    req, // Make the req.user information available in the context

  }),
});

const checkKafkaConnection = async () => {
  const admin = kafka.admin();

  try {
    await admin.connect();
    console.log('Connected to Kafka cluster');
  } catch (error) {
    console.error('Error connecting to Kafka cluster:', error);
  } finally {
    await admin.disconnect();
  }
};
checkKafkaConnection();

producer.connect()
  .then(() => console.log('Connected to Kafka producer.'))
  .catch((err) => console.error('Error connecting to producer:', err));

// Disconnect producer when the application shuts down
process.once('SIGINT', async () => {
  await producer.disconnect();
  console.log('Producer disconnected.');
  process.exit(0);
});

// set Kafka consumers
for (let i = 1; i <= 10; i += 1) {
  kafkaConsumer(i).catch((error) => {
    console.error('Error starting Kafka consumer:', error);
  });
}

await server.start();

const httpServer = createServer(app); // create  http server instance
server.applyMiddleware({ app, path: '/graphql' }); // Apollo Server with Express

// set up the WebSocket subscription server
SubscriptionServer.create(
  {
    execute,
    subscribe,
    schema, // Use the combined schema directly (makeExecutableSchema required)
  },
  {
    server: httpServer,
    path: '/graphql',
  },
);
// baseline test
app.use('/api', postAPI);

// endpoint for Kubernetes to check if the pod is ready to handle requests
app.get('/health', (req, res) => {
  res.status(200).json('OK');
});

// handle both HTTP and WebSockets
httpServer.listen(port, () => {
  console.log(`GraphQL server started on http://localhost:${port}${server.graphqlPath}`);
  console.log(`GraphQL WebSocket-based subscriptions listening on ws://localhost:${port}${server.graphqlPath}`);
});
