const Task = require('../models/task');
const User = require('../models/user');
const error = require('../utils/error');
const factory = require('../utils/factory');
const validator = require('validator');

exports.getAllTasks = async function (args, req) {
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
};

exports.getTaskById = async function ({ id }, req) {
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
};

exports.createTask = async function ({ taskInput }, req) {
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
        error.throwError('Logged in user is not a valid one.', 404);
    }

    let assignedUser;
    if (taskInput.assignee) {
        assignedUser = await User.findById(taskInput.assignee);
        if (!assignedUser) {
            error.throwError('Assigned user does not exist.', 404);
        }
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
};

exports.updateTask = async function ({ id, taskInputData }, req) {
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
    if (validator.isEmpty(taskInputData.description)) {
        errors.push({ message: 'Decription is invalid.' });
    }
    if (errors.length > 0) {
        error.throwError('Invalid input.', 422);
    }

    if (task.assignee?._id.toString() !== taskInputData.assignee) {
        const newAssignee = await User.findById(taskInputData.assignee);
        if (!newAssignee) {
            error.throwError('No such user!', 404);
        }

        newAssignee.assignedTasks.push(task);
        await newAssignee.save();

        const previousAssignee = await User.findById(task.assignee);
        if (previousAssignee) {
            previousAssignee.assignedTasks.pull(id);
            await previousAssignee.save();
        }
    }

    task.title = taskInputData.title ?? task.title;
    task.description = taskInputData.description ?? task.description;
    task.dueDate = Date.parse(taskInputData.dueDate) ?? task.dueDate;
    task.severity = taskInputData.severity ?? task.severity;
    task.assignee = taskInputData.assignee ?? task.assignee;

    const updatedTask = await task.save();

    return {
        ...updatedTask._doc,
        _id: updatedTask._id.toString(),
        dueDate: updatedTask.dueDate.toISOString(),
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString()
    }
};

exports.deleteTask = async function ({ id }, req) {
    if (!req.isAuth) {
        error.throwError('Not authenticated!', 401);
    }

    const task = await Task.findById(id);
    if (!task) {
        error.throwError('No task found!', 404);
    }
    if (task.creator._id.toString() !== req.userId.toString()) {
        error.throwError('The creator of the task is different than the currently logged in user', 403);
    }

    await Task.findByIdAndRemove(id);
    const creator = await User.findById(req.userId);
    creator.createdTasks.pull(id);
    await creator.save();

    if (task.assignee) {
        const assignee = await User.findById(task.assignee);
        assignee.assignedTasks.pull(id);
        await assignee.save();
    }

    return true;
};