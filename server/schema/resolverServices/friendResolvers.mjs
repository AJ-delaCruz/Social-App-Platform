import {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
} from '../services/friendServices.mjs';

const friendResolvers = {
  Query: {
    getAllFriends: (_, { userId }, { cassandra }) => getAllFriendsService(userId, cassandra),
  },
  Mutation: {
    sendFriendRequest:
    (
      _,
      { userId, friendId },
      { cassandra },
    ) => sendFriendRequestService(userId, friendId, cassandra),

    removeFriend: (
      _,
      { userId, friendId },
      { cassandra },
    ) => removeFriendService(userId, friendId, cassandra),
  },
};

export default friendResolvers;
