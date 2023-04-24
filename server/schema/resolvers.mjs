import userResolvers from './resolverServices/userResolvers.mjs';
import postResolvers from './resolverServices/postResolvers.mjs';
import commentResolvers from './resolverServices/commentResolvers.mjs';
import friendResolvers from './resolverServices/friendResolvers.mjs';

// Combine resolvers together from resolverServices
export default {
  Query: {
    // merge Query resolvers modules using Spread operator
    ...userResolvers.Query,
    ...postResolvers.Query,
    ...commentResolvers.Query,
  },
  Mutation: {
    // merge Mutation resolvers modules using Spread operator
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...friendResolvers.Mutation,
  },
};
