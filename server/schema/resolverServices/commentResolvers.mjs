import {
  getCommentService,
  getCommentsForPostService,
  getAllCommentsService,
  createCommentService,
} from '../services/commentServices.mjs';

const commentResolvers = {
  Query: {
    getComment: (_, args, { cassandra }) => getCommentService(args, cassandra),
    getCommentsForPost: (_, args, { cassandra }) => getCommentsForPostService(args, cassandra),
    getAllComments: (_, __, { cassandra }) => getAllCommentsService(cassandra),
  },
  Mutation: {
    createComment: (
      _,
      { postId, userId, body },
      { cassandra },
    ) => createCommentService(postId, userId, body, cassandra),
  },
};

export default commentResolvers;
