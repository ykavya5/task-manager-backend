const express = require("express");
const router = express.Router();
const Board   = require("../schema/board.schema");
const Task = require("../schema/task.schema");
const User = require("../schema/user.schema")
const authMiddleware = require("../middleware/auth");
const isAuth = require("../utils/index");

router.post("/create/:boardId", authMiddleware, async (req, res) => {
    const { user } = req;
    const { boardId } = req.params;
    console.log(user);
    let { title, priority, dueDate, assignedTo, checklist } = req.body;
    console.log(checklist, typeof checklist);

    try {
       
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { owner: user },
                { members: user }
            ]
        });

        if(!board){
            return res.status(404).json({message: "Board not found"});
        }
        if(String(board.owner) !== String(user._id) && String(board.members.find(member => member === user._id)) === undefined){
            return res.status(401).json({message: "Unauthorized"});
        }
      
        console.log(board);

        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate)) {
            return res.status(400).json({ message: "Invalid due date format" });
        }

          try{
                checklist = JSON.parse(checklist);
                assignedTo = JSON.parse(assignedTo);
                if (!Array.isArray(assignedTo) || !assignedTo.every(id => id.trim())) {
                    assignedTo = []; 
                }
                console.log(checklist, assignedTo);
          }catch(e){
            return res.status(400).json({ message: "Invalid JSON format to checklist or assignedTo" });
          }
         

        const formattedChecklist = checklist.map(item =>({
            item: item.item,
            checked: item.checked
        }));
        if (!["low", "moderate", "high"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority value" });
        }
        
        const status = 'todo'; 

        const task = new Task({
            title,
            priority,
            status, 
            dueDate: parsedDueDate,
            assignedTo,
            checklist: formattedChecklist,
        });

      
        await task.save();
        board.tasks.todo.push(task._id);
        await board.save();

        res.status(200).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put("/move/:taskId", authMiddleware, async (req, res) =>{
    const {user} =  req;
    const {taskId} = req.params;
    const { newStatus } = req.body;
    try{
        const task = await Task.findById(taskId);
        console.log(task);
        if(!task){
            return res.status(404).json({message: "Task not found"});
        }

        const board = await Board.findOne({
            $and: [
                { $or: [{ owner: user }, { members: user }] },
                { $or: [
                    { "tasks.backlog": taskId },
                    { "tasks.todo": taskId },
                    { "tasks.inprogress": taskId },
                    { "tasks.done": taskId }
                ]}
            ]
            
        });

        if(!board){
            return res.status(401).json({message: "Unauthorized to move task"});

        }

        const currentStatus = task.status;
        const currentStatusArray = board.tasks[currentStatus.toLowerCase().replace(' ', '')]; 
        const taskIndex = currentStatusArray.indexOf(task._id);
        if (taskIndex === -1) {
            return res.status(404).json({ message: "Task not found in current status" });
        }

        currentStatusArray.splice(taskIndex, 1);

        task.status = newStatus;
        const newStatusArray = board.tasks[newStatus.toLowerCase().replace(' ', '')];
        newStatusArray.push(task._id);
        

        await task.save();
        await board.save();
        res.status(200).json({message: "Task moved successfully", task});
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: "Interval Server error"})
    }
});

router.put("/update/:taskId", authMiddleware, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, priority, dueDate, assignedTo, checklist } = req.body;


        let formattedChecklist = checklist ? JSON.parse(checklist) : [];
        let parsedAssignedTo = assignedTo ? JSON.parse(assignedTo) : [];

      
        formattedChecklist = formattedChecklist.map(chitem => ({
            item: chitem.item,
            checked: chitem.checked
        }));

     
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({ message: "Invalid due date format" });
        }

        let task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        
        if (String(task.owner) !== String(req.user._id) && 
            !task.members.some(member => String(member) === String(req.user._id))) {
            return res.status(401).json({ message: "Unauthorized" });
        }

       
        task = await Task.findByIdAndUpdate(
            taskId,
            {
                title,
                priority,
                dueDate: parsedDueDate,
                assignedTo: parsedAssignedTo,
                checklist: formattedChecklist
            },
            { new: true } 
        );

        res.status(200).json({ message: "Task updated successfully", task });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: "Internal server error" });
    }
});


router.delete("/delete/:taskId", authMiddleware, async (req, res) =>{
    const { user } = req;
    const { taskId } = req.params;
    try{
        const task = await Task.findById(taskId);
        if(!task){
            return res.status(404).json({message: "Task not found"});
        }
        const board = await Board.findOne({
            $or: [
                { owner: user },
                { members: user }
            ],
            $or: [
                { "tasks.backlog": taskId },
                { "tasks.todo": taskId },
                { "tasks.inProgress": taskId },
                { "tasks.done": taskId }
            ]
        });

        if (!board) {
            return res.status(401).json({ message: "Unauthorized to delete task" });
        }
        console.log("before delete", board);
        const currentStatus = task.status.toLowerCase();
        console.log(currentStatus);
        console.log(board.tasks[currentStatus]);
       
        board.tasks[currentStatus] = board.tasks[currentStatus].filter(t => t._id.toString() !== task._id.toString());
        

        await board.save();
        await Task.findByIdAndDelete(taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
    })
router.delete("/deleteall/:boardId", authMiddleware, async (req, res) =>{
    const { user } = req;
    const { boardId } = req.params;
    const { status } = req.body;
    try{
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { owner: user },
                { members: user }
            ]
        }).populate(`tasks.${status}`, '_id');

        if(!board){
            return res.status(404).json({message: "Board not found or unauthorized"});
        }
        
        const tasksToDelete = board.tasks[status].map(task => task._id);
        console.log(tasksToDelete);
        await Task.deleteMany({_id: {$in: tasksToDelete}});
        board.tasks[status] = [];
        await board.save();
      
        res.status(200).json({ message: " Tasks are deleted successfully" });
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
    });

   

    


module.exports = router;
