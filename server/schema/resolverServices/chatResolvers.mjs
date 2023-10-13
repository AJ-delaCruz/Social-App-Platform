import {
  getChatListService,
  getOrCreateChatService,
  getChatService,
} from '../services/chatServices.mjs';

const chatResolvers = {
  Query: {
    getChat: (_, { chatId }, { redis }) => getChatService(chatId, redis),
    getChatList: (_, { userId }, { redis }) => getChatListService(userId, redis),
    getOrCreateChat: (_, { userId, recipientId }) => getOrCreateChatService(userId, recipientId),
  },
};

export default chatResolvers;
