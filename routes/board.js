const express = require("express");
const router = express.Router();
const Board   = require("../schema/board.schema");
const Task = require("../schema/task.schema");
const User = require("../schema/user.schema")
const authMiddleware = require("../middleware/auth");
const isAuth = require("../utils/index");

router.get("/", authMiddleware, async(req, res)=>{
    const {user} = req;
    try{
        const board = await Board.findOne({
            $or : [
                {owner: user},
                { members : user}

            ]
        }).populate('members', 'email').populate({
            path: 'tasks.backlog tasks.todo tasks.inprogress tasks.done',
            model: Task
        });

        res.status(200).json({message: "Board fetched successfully", board});

    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.post("/", authMiddleware, async(req, res)=>{
    try{
        const { user } = req;
        let board = await Board.findOne({owner: user});
        if(!board){
        const defaultBoard = {
            owner: user,
            members: [],
            tasks: {
                backlog: [],
                todo: [],
                inprogress: [],
                done: []
            },
           
        };
        board = new Board(defaultBoard);
    
    await board.save();
        }
    res.status(200).json({message: "default board is created", board});
}catch(error){
    console.log(error);
    res.status(500).json({message: "Internal server error"});
}


});

router.post("/addMembers/:id", authMiddleware, async(req, res)=>{
    try{
        const { user } = req;
        const {id} = req.params;
        console.log(id);
        const board = await Board.findOne({
            $or : [
                {owner: user},
                { members : user}

            ]
        })
       
        if (!board) {
            return res.status(404).json({ message: "Board not found for this owner or member" });
        }
        const membersExists = await User.findById(id);

        if(!membersExists){
            return res.status(400).json({message: "Member not found"});
    }

          if(!board.members.includes(membersExists._id)){
            board.members.push(membersExists._id);
          } else{
            return res.status(400).json({message: "Member already exists"});
          }
          await board.save();
          res.status(200).json({message: "Member added successfully, members: board.members"}); 
          
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal server error"});
        }
});

module.exports = router;
