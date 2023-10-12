import {
  getChatListService,
  getOrCreateChatService,
  getChatService,
} from '../services/chatServices.mjs';

const chatResolvers = {
  Query: {
    getChat: (_, { chatId }) => getChatService(chatId),
    getChatList: (_, { userId }) => getChatListService(userId),
    getOrCreateChat: (_, { userId, recipientId }) => getOrCreateChatService(userId, recipientId),
  },
};

export default chatResolvers;
