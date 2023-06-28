/* eslint-disable */
const likeResolvers = {
  Query: {
    async getPostLikes(_, { postId }, { cassandra }) {
      // TODO
    },
    async getPostDislikes(_, { postId }, { cassandra }) {
      // TODO
    },
    // async getCommentLikes(_, { commentId }, { cassandra }) {
    //   // TODO
    // },
    // async getCommentDislikes(_, { commentId }, { cassandra }) {
    //   // TODO
    // },
  },
  Mutation: {
    async likePost(_, { postId, userId }, { cassandra }) {
      // TODO
    },
    async dislikePost(_, { postId, userId }, { cassandra }) {
      // TODO
    },
  },
};

export default likeResolvers;
