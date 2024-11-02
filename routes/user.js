const express = require("express");
const router = express.Router();
const User   = require("../schema/user.schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

router.post("/register", async (req, res) => {
    const {name, email, password, confirmPassword} = req.body;
    try{
    const ifUserExits = await User.findOne({email});
    if(ifUserExits){
        return res.status(400).json({message: "User already exits"});
    }
    else if(password !== confirmPassword){
        return res.status(400).json({message: "Passwords do not match"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword});
    await user.save();
    res.status(200).json({message: "User registered successfully"});

    } catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.get(("/"), async(req, res)=>{
    try{
    const users = await User.find().select("-password");
    res.status(200).json(users);
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
})
router.get(("/byid/:id"), async(req, res)=>{
    const {id} = req.params; 
    try{
        if(!id){
            res.status(401).json({message: "User does not exist"})
        }
    const users = await User.findById(id);
    res.status(200).json(users);
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Internal server error"});
    }
})

 
router.post("/login", async(req, res)=>{
    const {email, password} = req.body;
    try{
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message: "User does not exist"});
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect){
        return res.status(400).json({message: "Incorrect password"});
    }
    const payload = {id: user._id};
    const token = jwt.sign(payload, process.env.SECRET_KEY);
    res.status(200).json({token});
}catch(error){
    console.log(error);
    res.status(500).json({message: "Internal server error"});
}
})

router.put("/update/:id", async(req, res)=>{

    const { name, email, oldPassword, newPassword} = req.body;
    try{
    const user = await User.findById(req.params.id);
    if(!user){
        return res.status(401).json({message: "User does not exist"});
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if(!match){
        return res.status(400).json({message: "Old password is Incorrect"});
    }
    user.name = name;
    user.email = email;
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({message: "User updated successfully"});


}catch(error){
    console.log(error);
    res.status(500).json({message: "Internal server error"});
}
    
})

module.exports = router;