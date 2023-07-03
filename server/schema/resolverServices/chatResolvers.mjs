import {
  getChatListService,
  getOrCreateChatService,
  getChat,
} from '../services/chatServices.mjs';

const chatResolvers = {
  Query: {
    getChat: (_, { chatId }) => getChat(chatId),
    getChatList: (_, { userId }) => getChatListService(userId),
    getOrCreateChat: (_, { userId, recipientId }) => getOrCreateChatService(userId, recipientId),
  },
};

export default chatResolvers;
