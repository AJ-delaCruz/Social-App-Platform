import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema/typeDefs.mjs';
import resolvers from './schema/resolvers.mjs';
import { pgDb, cassandra, redis } from './utils/db.mjs';
import { checkAuth } from './utils/passport.mjs';
import { kafka } from './kafka-server/kafkaClient.mjs';

dotenv.config();

const port = process.env.PORT || 4000;
const app = express();

app.use(cors());

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
app.use('/graphql', checkAuth);

// Create an instance of Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
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
//
// const producer = kafka.producer();
//
// await producer.connect();
// await producer.send({
//   topic: 'test-topic',
//   messages: [
//     { value: 'Hello KafkaJS user!' },
//   ],
// });
//
// await producer.disconnect();
//
// const consumer = kafka.consumer({ groupId: 'test-group' });
//
// await consumer.connect();
// await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
//
// await consumer.run({
//   eachMessage: async ({ topic, partition, message }) => {
//     console.log({
//       value: message.value.toString(),
//     });
//   },
// });
await server.start();
server.applyMiddleware({ app, path: '/graphql' }); // Apollo Server with Express

app.listen(port, () => {
  console.log(`GraphQL server started on http://localhost:${port}${server.graphqlPath}`);
});
