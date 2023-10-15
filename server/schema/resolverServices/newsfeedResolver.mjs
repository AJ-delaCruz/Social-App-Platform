import { getNewsFeedService, fetchNewsFeedService, addPostToNewsfeedService } from '../services/newsFeedService.mjs';
import { getAllPostsService } from '../services/postServices.mjs';
import { getAllFriendsService } from '../services/friendServices.mjs';

// call getNewsFeedService to return new function (with getAllPostsService, getAllFriendsService)
const getNewsFeed = getNewsFeedService(getAllPostsService, getAllFriendsService);

const newsFeedResolver = {
  Query: {
    getNewsFeed: ( // fan-out on read
      _,
      { userId }, // extract userId from object
    ) => getNewsFeed(userId),

    fetchNewsFeed: (_, { userId, limit }) => fetchNewsFeedService(userId, limit),

  },
  Mutation: {
    addPostToNewsfeed: (_, { userId, post }) => addPostToNewsfeedService(userId, post),

  },
};

export default newsFeedResolver;
