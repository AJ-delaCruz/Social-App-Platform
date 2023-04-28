import { PubSub } from 'graphql-subscriptions';

// handles real time communication by being the bridge from kafka to GraphQL subscription
const pubsub = new PubSub();

export default pubsub;
