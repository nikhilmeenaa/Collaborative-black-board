const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/canvas')
.then(()=>{
    console.log("Successfully connected to Database...");
})

.catch((error)=>{
    console.log("Some Error Occured while connecting to DB");
})