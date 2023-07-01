import {
  getCommentService,
  getCommentsForPostService,
  createCommentService,
} from '../services/commentServices.mjs';

const commentResolvers = {
  Query: {
    getComment: (_, args) => getCommentService(args),
    getCommentsForPost: (_, args) => getCommentsForPostService(args),
  },
  Mutation: {
    createComment: (
      _,
      { postId, userId, body },
    ) => createCommentService(postId, userId, body),
  },
};

export default commentResolvers;
