const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        severity: {
            type: String,
            required: true
        },
        creator: {
            type: String,
            required: true
        },
        assignee: {
            type: String,
            required: false
        }
    }, { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);