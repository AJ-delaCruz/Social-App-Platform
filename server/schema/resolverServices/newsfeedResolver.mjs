import getNewsFeedService from '../services/newsFeedService.mjs';

const newsFeedResolver = {
  Query: {
    getNewsFeed: (
      _,
      { userId }, // extract userId from object
    ) => getNewsFeedService(userId),
  },
  Mutation: {

  },
};

export default newsFeedResolver;
