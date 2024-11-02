const mongoose = require("mongoose");
const { User } = require("./user.schema");

const taskSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
    },
    priority:{
        type: String,
        required: true,
        enum :  ['low', 'moderate', 'high'],

    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
    checklist: [{
        item: {
            type: String,
            required:true,
        },
        checked: {
            type: Boolean,
            default: false
        },
    }],
    dueDate: {
        type: Date,
        
    },
    status:{
        type: String,
        enum: ['backlog', 'todo', 'inprogress', 'done'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

    });

    const Task = mongoose.model("Task", taskSchema);
    module.exports = Task;
