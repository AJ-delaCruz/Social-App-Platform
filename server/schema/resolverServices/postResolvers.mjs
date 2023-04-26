import {
  getPostService,
  getAllPostsService,
  createPostService,
} from '../services/postServices.mjs';

const postResolvers = {
  Query: {
    getPost: (_, args, { cassandra }) => getPostService(args, cassandra),
    getAllPosts: (_, __, { cassandra }) => getAllPostsService(cassandra),
  },
  Mutation: {
    createPost: (_, { userId, body }, { cassandra }) => createPostService(userId, body, cassandra),
  },
};

export default postResolvers;
