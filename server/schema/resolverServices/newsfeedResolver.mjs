import getNewsFeedService from '../services/newsFeedService.mjs';

const newsFeedResolver = {
  Query: {
    getNewsFeed: (_, args) => getNewsFeedService(args),
  },
  Mutation: {

  },
};

export default newsFeedResolver;
