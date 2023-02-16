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
    },
    updateTask: async function({id, taskInputData}) {
        const task = await Task.findById(id);
        console.log(taskInputData);
        if (!task) {
            const error = new Error(`Task with id ${id} does not exist`);
            error.code = 404;
            throw error;
        }

        task.title = taskInputData.title;
        task.description = taskInputData.description;
        task.dueDate = taskInputData.dueDate;
        task.severity = taskInputData.severity;
        task.assignee = taskInputData.assignee;

        const updatedTask = await task.save();
        return {
            ...updatedTask._doc,
            _id: updatedTask._id.toString(),
            dueDate: updatedTask.dueDate.toISOString(),
            createdAt: updatedTask.createdAt.toISOString(),
            updatedAt: updatedTask.updatedAt.toISOString()
        }
    }
};