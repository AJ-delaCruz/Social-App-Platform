import {
  getUserService,
  getAllUsersService,
  registerUserService,
  loginService,
  updateUserService,
} from '../services/userServices.mjs';

const userResolvers = {
  Query: {
    getUser: (_, args, { req }) => getUserService(args, req),
    getAllUsers: () => getAllUsersService(),
  },
  Mutation: {
    registerUser: (_, { input }) => registerUserService(input),
    login: (_, { input }) => loginService(input),
    updateUser: (_, { id, input }) => updateUserService(id, input),
  },
};

export default userResolvers;
