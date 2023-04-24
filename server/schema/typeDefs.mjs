import { gql } from 'apollo-server-express';

const typeDefs = gql`
    type User {
        id: ID!
        username: String!
        password: String!
        firstName: String
        lastName: String

    }
    type Post {
        id: ID!
        userId: Int!
        body: String!
        createdAt: String!
      }
    
    type Comment {
        id: ID!
        postId: ID!
        userId: Int!
        body: String!
        createdAt: String!
    }

    type Friend {
        id: ID!
        userId: ID!
        friendId: ID!
    }
      
      type Notification {
        id: ID!
        userId: ID!
        message: String!
        createdAt: String!
        type: String!
      }
      
    type Subscription {
        notification(userId: ID!): Notification!
    }
      

      
      
    type Query {
        getUser(id: ID!): User
        getAllUsers: [User]!
        
        getPost(id: ID!): Post
        getAllPosts: [Post]!
  
        getComment(id: ID!): Comment
        getCommentsForPost(postId: ID!): [Comment]!
        getAllComments: [Comment]!

        getAllFriends(userId: ID!): [User]!

   
    }
    
 

    type Mutation {
        registerUser(input: RegisterUserInput!): User!
        login(input: LoginUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!
        createPost(userId: Int!, body: String!): Post!
        createComment(postId: ID!, userId: Int!, body: String!): Comment!

        addFriend(userId: ID!, friendId: ID!): Friend!
        removeFriend(userId: ID!, friendId: ID!): Boolean
    }
    
 
    
    input RegisterUserInput {
        username: String!
        password: String!
    }
    
     input LoginUserInput {
        username: String!
        password: String!
    }
    
    input UpdateUserInput {
        username: String
        password: String
        firstName: String
        lastName: String
    }
    
    input CreatePostInput {
        userId: Int!
        body: String!
    }

    input CreateCommentInput {
        postId: ID!
        userId: Int!
        body: String!
    }
`;

export default typeDefs;
