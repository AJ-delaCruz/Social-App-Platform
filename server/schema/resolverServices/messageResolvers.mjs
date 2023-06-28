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
      { chatId, senderId, body },
    ) => createMessageService(chatId, senderId, body),
  },
};

export default messageResolvers;
