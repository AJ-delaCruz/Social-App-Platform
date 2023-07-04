import {
  createMessageService,
  getAllMessagesService,
} from '../services/messageServices.mjs';
import { getChatService } from '../services/chatServices.mjs';

const messageResolvers = {
  Query: {
    getAllMessages: (_, { senderId }) => getAllMessagesService(senderId),
  },
  Mutation: {
    createMessage: (
      _,
      { chatId, senderId, body },
    ) => createMessageService(chatId, senderId, body, getChatService),
  },
};

export default messageResolvers;
