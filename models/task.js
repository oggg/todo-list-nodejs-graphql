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
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }, { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);