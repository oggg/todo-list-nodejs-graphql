const task = require('../models/task');
const Task = require('../models/task');

module.exports = {
    tasks: async function (args) {
        const taskList = await Task.find({});
        return taskList.map(t => {
            return {
                ...t._doc,
                _id: t._id.toString(),
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt?.toISOString()
            };
        })

    },
    createTask: async function ({ taskInput }) {
        const task = new Task({
            title: taskInput.title,
            description: taskInput.description,
            dueDate: Date.parse(taskInput.dueDate),
            severity: taskInput.severity,
            creator: 'me'
        });

        const createdTask = await task.save();
        return {
            ...createdTask._doc,
            _id: createdTask._id.toString(),
            createdAt: createdTask.createdAt.toISOString(),
            updatedAt: createdTask.updatedAt?.toISOString()
        }
    }
};