const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Task = require('../models/task');
const error = require('../utils/error');
const factory = require('../utils/factory');

module.exports = {
    createUser: async function ({ userInput }) {
        const errors = [];
        if (!validator.isEmail(userInput?.email)) {
            errors.push({ message: 'E-Mail is invalid.' });
        }
        if (
            validator.isEmpty(userInput?.password) ||
            !validator.isLength(userInput.password, { min: 4 })
         ) {
            errors.push({ message: 'Password too short!' });
        }
        if (errors.length > 0) {
            error.throwError('Invalid input.', 422)
        }

        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) {
            error.throwError('User exists already!', 409);
        }

        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = factory.createUser(userInput.email, userInput.name, hashedPw);
        
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
    tasks: async function (args, req) {
        if (!req.isAuth) {
            error.throwError('Not authenticated!', 401);
        }
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
    task: async function ({ id }, req) {
        if (!req.isAuth) {
            error.throwError('Not authenticated!', 401);
        }
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
    createTask: async function ({ taskInput }, req) {
        if (!req.isAuth) {
            error.throwError('Not authenticated!', 401);
        }

        const errors = [];
        if (validator.isEmpty(taskInput.title)) {
            errors.push({ message: 'Title is invalid.' });
        }

        if (validator.isEmpty(taskInput.description)) {
            errors.push({ message: 'Description is invalid.' });
        }

        if (validator.isEmpty(taskInput.dueDate)) {
            errors.push({ message: 'Due date is invalid' })
        }

        if (errors.length > 0) {
            error.throwError('Invalid input.', 422);
        }

        const user = await User.findById(req.userId);
        if (!user) {
            error.throwError('Invalid user.', 401);
        }

        const task = factory.createTask(taskInput.title, taskInput.description,
            taskInput.dueDate, taskInput.severity, user);

        const createdTask = await task.save();
        user.createdTasks.push(createdTask);
        await user.save();

        return {
            ...createdTask._doc,
            _id: createdTask._id.toString(),
            dueDate: createdTask.dueDate.toISOString(),
            createdAt: createdTask.createdAt.toISOString(),
            updatedAt: createdTask.updatedAt?.toISOString()
        }
    },
    updateTask: async function ({ id, taskInputData }, req) {
        if (!req.isAuth) {
            error.throwError('Not authenticated!', 401);
        }

        const task = await Task.findById(id).populate('creator').populate('assignee');
        if (!task) {
            error.throwError('No task found!', 404);
        }
        if (task.creator._id.toString() !== req.userId.toString()) {
            error.throwError('Not authorized!', 403);
        }
        const errors = [];
        if (validator.isEmpty(taskInputData.title)) {
            errors.push({ message: 'Title is invalid.' });
        }
        if (validator.isEmpty(taskInputData.decription)) {
            errors.push({ message: 'Decription is invalid.' });
        }
        if (errors.length > 0) {
            error.throwError('Invalid input.', 422);
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
    deleteTask: async function ({ id }, req) {
        if (!req.isAuth) {
            error.throwError('Not authenticated!', 401);
        }

        const task = await Task.findById(id);
        if (!task) {
            error.throwError('No task found!', 404);
        }
        if (task.creator._id.toString() !== req.userId.toString()) {
            error.throwError('Not authorized!', 403);
        }

        task.findByIdAndRemove(id);
        const creator = await User.findById(req.userId);
        creator.createdTasks.pull(id);
        await creator.save();

        if (task.assignee) {
            const assignee = await User.findById(task.assignee);
            assignee.assignedTasks.pull(id);
            await assignee.save();
        }

        return true;
    }
};