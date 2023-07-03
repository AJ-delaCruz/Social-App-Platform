import getNewsFeedService from '../services/newsFeedService.mjs';
import { getAllPostsService } from '../services/postServices.mjs';
import { getAllFriendsService } from '../services/friendServices.mjs';

const getNewsFeed = getNewsFeedService(getAllPostsService, getAllFriendsService);

const newsFeedResolver = {
  Query: {
    getNewsFeed: (
      _,
      { userId }, // extract userId from object
    ) => getNewsFeed(userId),
  },
  Mutation: {

  },
};

export default newsFeedResolver;
