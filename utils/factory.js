const User = require('../models/user');
const Task = require('../models/task');

exports.createUser = (email, name, password) => new User({
    email: email,
    name: name,
    password: password
});

exports.createTask = (title, description, dueDate, severity, creator, assignee) => new Task({
    title: title,
    description: description,
    dueDate: Date.parse(dueDate),
    severity: severity,
    creator: creator,
    assignee: assignee
});