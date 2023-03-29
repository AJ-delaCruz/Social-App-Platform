import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {typeDefs} from './schema/typeDefs.mjs';
import {resolvers} from './schema/resolvers.mjs';
const port = process.env.PORT || 4000;

const app = express();

const server = new ApolloServer({typeDefs, resolvers});
await server.start();
server.applyMiddleware({app});

app.listen(port, () => {
    console.log(`GraphQL server started on on http://localhost:${port}${server.graphqlPath}`);
});
