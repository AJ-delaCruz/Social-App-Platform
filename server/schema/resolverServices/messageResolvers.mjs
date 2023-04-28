import {
  createMessageService,
  getAllMessagesService,
} from '../services/messageServices.mjs';

const messageResolvers = {
  Query: {
    getAllMessages: (_, { senderId }) => getAllMessagesService(senderId),
  },
  Mutation: {
    createMessage: (
      _,
      { senderId, recipientId, body },
    ) => createMessageService(senderId, recipientId, body),
  },
};

export default messageResolvers;
