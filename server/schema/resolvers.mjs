import userResolvers from './resolverServices/userResolvers.mjs';
import postResolvers from './resolverServices/postResolvers.mjs';
import commentResolvers from './resolverServices/commentResolvers.mjs';
import friendResolvers from './resolverServices/friendResolvers.mjs';
import notificationResolvers from './resolverServices/notificationResolvers.mjs';
import chatResolvers from './resolverServices/chatResolvers.mjs';
import messageResolvers from './resolverServices/messageResolvers.mjs';
import newsFeedResolver from './resolverServices/newsfeedResolver.mjs';
// Combine resolvers together from resolverServices
const resolvers = [
  userResolvers,
  postResolvers,
  commentResolvers,
  friendResolvers,
  notificationResolvers, // subscription
  chatResolvers,
  messageResolvers,
  newsFeedResolver,
];

export default resolvers;
