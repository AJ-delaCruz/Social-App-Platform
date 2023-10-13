import {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
} from '../services/friendServices.mjs';

const friendResolvers = {
  Query: {
    getAllFriends: (_, { userId }, { redis }) => getAllFriendsService(userId, redis),
  },
  Mutation: {
    sendFriendRequest:
      (
        _,
        { userId, friendId },
        { redis },
      ) => sendFriendRequestService(userId, friendId, redis),

    removeFriend: (
      _,
      { userId, friendId },
      { redis },
    ) => removeFriendService(userId, friendId, redis),
  },
};

export default friendResolvers;
