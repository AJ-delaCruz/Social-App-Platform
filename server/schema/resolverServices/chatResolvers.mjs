import {
  getChatListService,
  getOrCreateChatService,
} from '../services/chatServices.mjs';

const chatResolvers = {
  Query: {
    getChatList: (_, { userId }) => getChatListService(userId),
    getOrCreateChat: (_, { userId, recipientId }) => getOrCreateChatService(userId, recipientId),
  },
};

export default chatResolvers;
