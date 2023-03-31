import { gql } from 'apollo-server-express';

const typeDefs = gql`
    type User {
        id: ID!
        username: String!
        password: String!
        firstName: String
        lastName: String

    }

    type Query {
        getUser(id: ID!): User
        getAllUsers: [User]!
    }
    
 

    type Mutation {
        registerUser(input: RegisterUserInput!): User!
        login(input: LoginUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!
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
`;

export default typeDefs;
