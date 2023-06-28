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
        userId: ID!
        body: String!
        createdAt: String!
      }
    
    type Comment {
        id: ID!
        postId: ID!
        userId: ID!
        body: String!
        createdAt: String!
    }

    type Friend {
        id: ID!
        userId: ID!
        friendId: ID!
    }

    type Chat {
        id: ID!
        userId: ID!
        recepientId: [ID]!
        createdAt: String!
        updatedAt: String!
    }

    type Message {
        id: ID!
        chatId: ID!
        senderId: ID!
        body: String!
        createdAt: String!

    }
      
    type Notification {
        id: ID!
        userId: ID!
        message: String!
        createdAt: String!
        type: String!
    }
      
    type Subscription {
        newNotification(userId: ID!): Notification!

        newMessage(chatId: ID!): Message!

    }
      

      
      
    type Query {
        getUser(id: ID!): User
        getAllUsers: [User]!
        
        getPost(id: ID!): Post
        getAllPosts: [Post]!
        getFriendsPosts(userId: ID!) : [Post]!
  
        getComment(id: ID!): Comment
        getCommentsForPost(postId: ID!): [Comment]!
        getAllComments: [Comment]!

        getAllFriends(userId: ID!): [User]!

        getChatList(userId: ID!): [Chat]!
        getOrCreateChat(userId: ID!, recepientId: [ID]!): Chat!

        getAllMessages(chatId: ID!): [Message]!
    

    }
    
 

    type Mutation {
        registerUser(input: RegisterUserInput!): User!
        login(input: LoginUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!

        createPost(userId: ID!, body: String!): Post!
        createComment(postId: ID!, userId: ID!, body: String!): Comment!

        sendFriendRequest(userId: ID!, friendId: ID!): Friend!
        removeFriend(userId: ID!, friendId: ID!): Boolean!

        createMessage(chatId: ID!, senderId: ID!, body: String!): Message!

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
