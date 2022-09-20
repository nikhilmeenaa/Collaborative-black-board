const collection = require('../Database/collect');

async function home(req , res){
    // res.send("HOME");
    res.send("Hello Brother");
    // await res.render('index.hbs');
}

function about(req , res)
{
    res.send("ABOUT");
}

async function postCanvasData(req , res)
{
    const postableData = req.body;
    // postableData[0].name = 'Nikhil';
    // console.log(postableData);

    // console.log("Canvas Data Saved Successfully.....");
    res.send("Nikhil Meena");
    console.log(req.body);
    const obj = {
        name : "Nikhil Meena" , 
        age : 18 , 
    }

    collection.insertMany(postableData).then(()=>{
        console.log("successfully saved data");
    });
}

async function getCanvasData(req , res){
    const arr = await collection.findOne();
    // console.log(arr);
    res.json(arr);
    console.log('');
    console.log("successfully send data");
    console.log('');
}

module.exports.home = home;
module.exports.about = about;
module.exports.getCanvasData = getCanvasData;
module.exports.postCanvasData = postCanvasData;
