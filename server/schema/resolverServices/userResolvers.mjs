import {
  getUserService,
  getAllUsersService,
  registerUserService,
  loginService,
  updateUserProfileService,
} from '../services/userServices.mjs';

const userResolvers = {
  Query: {
    getUser: (_, { id }, { redis }) => getUserService(id, redis),
    getAllUsers: () => getAllUsersService(),
  },
  Mutation: {
    registerUser: (_, { input }) => registerUserService(input),
    login: (_, { input }) => loginService(input),
    updateUserProfile: (
      _,
      { id, input },
      { req, redis },
    ) => updateUserProfileService(id, req, input, redis),
  },
};

export default userResolvers;
