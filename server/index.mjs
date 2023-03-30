import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {typeDefs} from './schema/typeDefs.mjs';
import {resolvers} from './schema/resolvers.mjs';
import {pgdb} from './utils/db.mjs';
const port = process.env.PORT || 4000;

const app = express();

// Connect to Postgres
pgdb.connect(function (err) {
    if (err) throw err;
    console.log("Postgres Connected");
});
// Create an instance of Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => {
        return {
            pgdb,
        };
    }
});
await server.start();
server.applyMiddleware({app, path: "/graphql"}); // Apollo Server with Express

app.listen(port, () => {
    console.log(`GraphQL server started on http://localhost:${port}${server.graphqlPath}`);
});
