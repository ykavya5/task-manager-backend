const mongoose = require("mongoose");
const { User } = require("./user.schema");

const { Task }  = require("./task.schema");

const boardSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    tasks: {
        backlog: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        }],
        todo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        }],
        inprogress: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        }],
        done: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        }],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

boardSchema.index({ owner: 1 }, { unique: true });

const Board = mongoose.model("Board", boardSchema);
module.exports = Board;