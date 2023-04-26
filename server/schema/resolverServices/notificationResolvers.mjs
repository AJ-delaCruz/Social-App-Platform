import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const notificationResolvers = {
  Subscription: {
    newNotification: { // define a subscribe function
      subscribe: () => pubsub.asyncIterator(['NEW_NOTIFICATION']), // listens for NEW_NOTIFICATION events
    },
  },
};

export default notificationResolvers;
