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

    input TaskInput {
        title: String!
        description: String!
        dueDate: String!
        severity: String!
    }

    type Query {
        tasks: [Task!]!
    }

     type Mutation {
        createTask(taskInput: TaskInput): Task!
        updateTask(id: ID!, taskInputData: TaskInput!): Task!
        deleteTask(id: ID!): Boolean
     }
`);