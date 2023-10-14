import pubsub from '../../utils/pubsub.mjs';

const notificationResolvers = {
  Subscription: {
    newNotification: { // define a subscribe function
      subscribe: (root, { userId }) => pubsub.asyncIterator([`NEW_NOTIFICATION_${userId}`]), // listens for NEW_NOTIFICATION events
      resolve: (payload) => payload.value,

    },
    newMessage: {
      subscribe: (_, { chatId }) => pubsub.asyncIterator([`NEW_MESSAGE_${chatId}`]),
      resolve: (payload) => payload.value,
    },
  },
};

export default notificationResolvers;
