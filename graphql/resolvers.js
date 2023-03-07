const userResolver = require('./resolver-users');
const taskResolver = require('./resolver-tasks');

module.exports = {
    createUser: userResolver.createUser,
    login: userResolver.login,
    tasks: taskResolver.getAllTasks,
    task: taskResolver.getTaskById,
    createTask: taskResolver.createTask,
    updateTask: taskResolver.updateTask,
    deleteTask: taskResolver.deleteTask
};