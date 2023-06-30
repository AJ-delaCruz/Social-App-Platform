import {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
} from '../services/friendServices.mjs';

const friendResolvers = {
  Query: {
    getAllFriends: (_, { userId }) => getAllFriendsService(userId),
  },
  Mutation: {
    sendFriendRequest:
      (
        _,
        { userId, friendId },
      ) => sendFriendRequestService(userId, friendId),

    removeFriend: (
      _,
      { userId, friendId },
    ) => removeFriendService(userId, friendId),
  },
};

export default friendResolvers;
