const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Task {
        _id: ID!
        title: String!
        description: String!
        dueDate: String!
        severity: String!
        creator: String!
        assignee: String
        createdAt: String!
        updatedAt: String
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input TaskInput {
        title: String!
        description: String!
        dueDate: String!
        severity: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        createdTasks: [Task!]!
        assignedTasks: [Task!]!
    }

    type Query {
        tasks: [Task!]!
        task(id: ID!): Task!
        login(email: String!, password: String!): AuthData!
    }

     type Mutation {
        createTask(taskInput: TaskInput): Task!
        updateTask(id: ID!, taskInputData: TaskInput!): Task!
        deleteTask(id: ID!): Boolean
        createUser(userInput: UserInputData): User!
     }
`);