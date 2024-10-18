const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = (req, res, next) =>{
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({mesagge : "User is not logged in"});

    }
    try{
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded.id;
        next();
    }catch(error){
        res.status(401).json({message: "User is not logged in"});
    }
}
module.exports = authMiddleware;