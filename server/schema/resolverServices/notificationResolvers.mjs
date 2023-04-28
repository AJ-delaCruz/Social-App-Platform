import pubsub from '../../utils/pubsub.mjs';

const notificationResolvers = {
  Subscription: {
    newNotification: { // define a subscribe function
      subscribe: () => pubsub.asyncIterator(['NEW_NOTIFICATION']), // listens for NEW_NOTIFICATION events
    },
    newMessage: {
      subscribe: () => pubsub.asyncIterator(['NEW_MESSAGE']),
      resolve: (payload) => payload.value,
    },
  },
};

export default notificationResolvers;
