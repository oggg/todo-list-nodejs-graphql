const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const task = require('../models/task');
const Task = require('../models/task');
const error = require('../utils/error');

module.exports = {
    createUser: async function ({ userInput }) {
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'E-Mail is invalid.' });
        }
        if (
            validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, { min: 5 })
        ) {
            errors.push({ message: 'Password too short!' });
        }
        if (errors.length > 0) {
            error.throwError('Invalid input.', 422)
        }

        const existingUser = await User.findOne({ email: userInput.email });
        if (!existingUser) {
            error.throwError('User exists already!', 409);
        }
        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPw
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },
    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            error.throwError('User not found.', 401);
        }

        const isPasswordEqual = await bcrypt.compare(password, user.password);
        if (!isPasswordEqual) {
            error.throwError('wrong input', 401)
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            },
            'somesupersecretsecret',
            { expiresIn: '1h' });

        return { token: token, userId: user._id.toString() };
    },
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
    task: async function ({ id }) {
        const task = await Task.findById(id);
        if (!task) {
            error.throwError(error.buildErrorMessageForId(id), 404);
        }

        return {
            ...task._doc,
            _id: task._id.toString(),
            dueDate: task.dueDate.toISOString(),
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt?.toISOString()
        }
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
            dueDate: createdTask.dueDate.toISOString(),
            createdAt: createdTask.createdAt.toISOString(),
            updatedAt: createdTask.updatedAt?.toISOString()
        }
    },
    updateTask: async function ({ id, taskInputData }) {
        const task = await Task.findById(id);
        console.log(taskInputData);
        if (!task) {
            error.throwError(error.buildErrorMessageForId(id), 404);
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
    },
    deleteTask: async function ({ id }) {
        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            error.throwError(error.buildErrorMessageForId(id), 404);
        }

        return true;
    }
};