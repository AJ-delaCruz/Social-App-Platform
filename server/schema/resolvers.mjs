import userResolvers from './resolverServices/userResolvers.mjs';
import postResolvers from './resolverServices/postResolvers.mjs';
import commentResolvers from './resolverServices/commentResolvers.mjs';
import friendResolvers from './resolverServices/friendResolvers.mjs';
import notificationResolvers from './resolverServices/notificationResolvers.mjs';

// Combine resolvers together from resolverServices
const resolvers = [
  userResolvers,
  postResolvers,
  commentResolvers,
  friendResolvers,
  notificationResolvers, // subscription
];

export default resolvers;
