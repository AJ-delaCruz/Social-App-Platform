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
      
      
      
    type Query {
        getUser(id: ID!): User
        getAllUsers: [User]!
        
        getPost(id: ID!): Post
        getAllPosts: [Post]!
  
        getComment(id: ID!): Comment
        getCommentsForPost(postId: ID!): [Comment]!
        getAllComments: [Comment]!
   
    }
    
 

    type Mutation {
        registerUser(input: RegisterUserInput!): User!
        login(input: LoginUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!
        createPost(userId: Int!, body: String!): Post!
        createComment(postId: ID!, userId: Int!, body: String!): Comment!
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
