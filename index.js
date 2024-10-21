const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require("body-parser");

const userRoutes = require("./routes/user");
const taskRoutes = require("./routes/task");
const boardRoutes = require("./routes/board") ;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use("/api/user", userRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/board", boardRoutes);

app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
    mongoose.connect(process.env.MONGOOSE_URI)
    mongoose.connection.on('connected', ()=>{
        console.log("MongoDB connected");
      });
    mongoose.connection.on('error', err => {
        console.log(`MongoDB connection error: ${err}`);
      });
})