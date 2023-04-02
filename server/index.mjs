import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema/typeDefs.mjs';
import resolvers from './schema/resolvers.mjs';
import { pgDb, cassandra } from './utils/db.mjs';
import { checkAuth } from './utils/passport.mjs';

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

// Authenticate all requests to the /graphql endpoint using the checkAuth middleware
app.use('/graphql', checkAuth);

// Create an instance of Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    pgdb: pgDb,
    cassandra,
    req, // Make the req.user information available in the context

  }),
});

await server.start();
server.applyMiddleware({ app, path: '/graphql' }); // Apollo Server with Express

app.listen(port, () => {
  console.log(`GraphQL server started on http://localhost:${port}${server.graphqlPath}`);
});
