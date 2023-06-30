import {
  getPostService,
  getAllPostsService,
  createPostService,
} from '../services/postServices.mjs';

const postResolvers = {
  Query: {
    getPost: (_, { userId }) => getPostService(userId),
    getAllPosts: (_, { userId }) => getAllPostsService(userId),
  },
  Mutation: {
    createPost: (_, { userId, body }) => createPostService(userId, body),
  },
};

export default postResolvers;
