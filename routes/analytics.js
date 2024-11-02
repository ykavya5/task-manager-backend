const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Board = require('../schema/board.schema');



router.get('/:boardId', async (req, res) => {
    const { boardId } = req.params;

    try {
        
        const board = await Board.findById(boardId).populate({
            path: 'tasks.backlog tasks.todo tasks.inprogress tasks.done',
            model: 'Task'
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

      
        const backlogCount = board.tasks.backlog.length;
        const todoCount = board.tasks.todo.length;
        const inprogressCount = board.tasks.inprogress.length;
        const doneCount = board.tasks.done.length;

       
        const allTasks = [
            ...board.tasks.backlog,
            ...board.tasks.todo,
            ...board.tasks.inprogress,
            ...board.tasks.done
        ];

        const lowPriorityCount = allTasks.filter(task => task.priority === 'low').length;
        const moderatePriorityCount = allTasks.filter(task => task.priority === 'moderate').length;
        const highPriorityCount = allTasks.filter(task => task.priority === 'high').length;
        const dueDateCount = allTasks.filter(task => task.dueDate).length;

       
        res.json({
            statusCounts: {
                backlog: backlogCount,
                todo: todoCount,
                inprogress: inprogressCount,
                done: doneCount,
            },
            priorityCounts: {
                low: lowPriorityCount,
                moderate: moderatePriorityCount,
                high: highPriorityCount,
            },
            dueDateTasks: dueDateCount,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
