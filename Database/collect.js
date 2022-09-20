const mongoose = require('mongoose');


const schema = mongoose.Schema({
    name : String  , 
    // age : Number
} , {
    strict : false
});


const collection = mongoose.model('canvasData' , schema );

module.exports = collection;