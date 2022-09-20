const brushColor = 'hotpink';
const brushSize = 30;
const colorPicker = document.getElementById("colorPicker");
const bgColorPicker = document.getElementById("bgColorPicker");
const select = document.getElementsByTagName("select");
const roomName = document.getElementById("roomName");
const joinButton = document.getElementById("joinRoom");
const copyButton = document.getElementById("copyButton");

// This returns a canvas
const makeCanvas = (id)=>{
    return new fabric.Canvas(id, {
      backgroundColor: "#f6f6f6",
      height : 3 * window.innerHeight , 
      width : 1 * window.innerWidth , 
      selection: false, // this is for avoiding selection in canvas
      isDrawingMode : true ,
      backgroundColor : "black" , 
});
}

// Sets background image of canvas passed with image url given
const setBackgroundImage = (url,passedCanvas) =>{
    fabric.Image.fromURL(
        url,
        (img) => {
            passedCanvas.backgroundImage = img;
            passedCanvas.renderAll();
        }
        );
    }
    
const canvas = makeCanvas('canvas');

// canvas.setHeight(3 * window.innerHeight);
// canvas.setWidth(2 * window.innerWidth);

// canvas.height = window.innerHeight ;
canvas.freeDrawingBrush.color = "white";
canvas.freeDrawingBrush.width = 3;

// Modes 

let currentMode = "drawing";
let currentBrushWidth = 2;
let queue = [];
let bgColor = "black";

const modes = {
    pan : "pan" , 
    drawing : "drawing" , 
    default : '' , 
    eraser : "eraser" , 
    a1 : 10 , a2 : 20 , a3 : 40 , a4 : 60 , a5 : 100 , 
}


function panToggle(mode)
{
    currentMode = mode;
    canvas.renderAll();

    if(currentMode == modes.drawing)
    {
        canvas.freeDrawingBrush.color = "cyan";
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = currentBrushWidth;
        canvas.renderAll();
    }

    else if(currentMode == modes.eraser)
    {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = bgColor;
        canvas.freeDrawingBrush.width = 40;
        canvas.renderAll();
    }

    else if( 0<=mode<=50 )
    {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = bgColor;
        canvas.freeDrawingBrush.width = mode;
        canvas.renderAll(); 
        eraserSizeToggle();
    }
}


function changeOption(event){
    canvas.renderAll();
    const value = event.target.value;
    canvas.isDrawingMode = true;
    currentBrushWidth = value ;
    canvas.freeDrawingBrush.width = value;
    canvas.renderAll(); 
};


colorPicker.addEventListener("input" , ()=>
{
    currentMode = modes.drawing;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = colorPicker.value;   
    canvas.freeDrawingBrush.width = currentBrushWidth;
    canvas.renderAll(); 
});

function penSize(value)
{
    canvas.isDrawingMode = true;
    currentBrushWidth = value ;
    canvas.freeDrawingBrush.width = value;
    canvas.renderAll(); 
    penSizeToggle();
}

let mouseDown = false;

canvas.on("mouse:move" , (event)=>{

    if(mouseDown && currentMode == modes.drawing)
    {
        canvas.isDrawingMode = true;
        canvas.renderAll();
    }

    else if(mouseDown && (currentMode == modes.drawing || currentMode == modes.eraser) )
    {
        queue = [];
        canvas.renderAll(); 
    }
});

let stored  = undefined ;
let transformed = undefined;
let bgImg = undefined;


canvas.on("mouse:down" ,()=>{
    mouseDown = true;
} );

let currentRoom = '';

const socket = io();

socket.on("connect" , ()=>{
    // console.log(socket.id);
});





let recent = undefined;

canvas.on("mouse:up" , ()=>{
    mouseDown = false;
    if(currentMode == modes.pan)
    {
        canvas.setCursor("grab");
        canvas.renderAll(); 
    }

    const json = JSON.stringify(recent);

    if(currentRoom != '')
    {
        socket.emit('newElement' , {
            room : currentRoom , 
            element : json
        });
    }

});






// CLEARING CANVAS

async function clearCanvas()
{   
    // console.log("here we are");
    if(currentRoom!='')
    socket.emit('clearCanvas' , {
        room : currentRoom
    });

    canvas.getObjects().forEach(obj => {
        canvas.remove(obj);
    });
}

socket.on('clearCanvas' , ()=>{
    canvas.getObjects().forEach(obj => {
        canvas.remove(obj);
    });
});

const elementAdded = function(obj) {
    recent = obj.target;
};

canvas.on('object:added', elementAdded);


socket.on('newElement' , async (json)=>{
    var circle = new fabric.Circle({
        radius: 50, fill: 'transparent', left: 50, top: 50
    });

    await canvas.add(circle);
    await canvas.renderAll();

    var jsonObj = JSON.parse(json);
    fabric.util.enlivenObjects([jsonObj], function (enlivenedObjects) {
        canvas.add(enlivenedObjects[0]);
        canvas.renderAll();
    }); 

    canvas.remove(circle);
    canvas.renderAll();

});

function doUndo(){
    if(canvas._objects.length>0)
    {
        queue.push( canvas._objects.pop() );

        if(currentRoom != '')
        {
            socket.emit('undo' , {
                room : currentRoom
            });
        }

        canvas.renderAll();
    }
}

function doRedo()
{
    if(queue.length > 0)
    {
        canvas._objects.push(queue.pop());

        if(currentRoom != '')
        {
            socket.emit('redo' , {
                room : currentRoom
            });
        }

        canvas.renderAll();
    }
}


socket.on('undo' , ()=>{
    if(canvas._objects.length>0)
    {
        queue.push( canvas._objects.pop() );
        canvas.renderAll();
    }
});

socket.on('redo' , ()=>{
    if(queue.length > 0)
    {
        canvas._objects.push(queue.pop());
        canvas.renderAll();
    }
});








async function createRoom()
{
    await socket.emit('createRoom');
}

const resDisplay = document.getElementById('createdRoomId');


const createBox = document.getElementById("createBox");
const joinBox = document.getElementById("joinBox");
const createButton= document.getElementById("createButton");



let usersList = [];


socket.on('createResult' , async (data)=>{

    const userName = document.getElementById("createUserName").value;

    clearCanvas();
    resDisplay.style.display = "block";
    resDisplay.innerHTML = data;
    currentRoom = data;

    const temp = document.getElementById('createFacility');


    temp.style.display = "none";

    createButton.style.display = "none";
    joinBox.style.display = "none";
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = "white";
    copyButton.style.display = "inline";

    usersList.push({
        name : userName , 
        id : currentRoom.slice(1) 
    })
    updateUsers();

    // console.log(usersList);
    // socket.emit('joinRequest' , currentRoom);
});



async function joinUser(){

    const name = document.getElementById("joinUserName").value;
    const roomId = document.getElementById("roomid").value;

    // console.log(name);
    if( name == '' )
    {
        setTimeout(()=>{
            document.getElementById("joinUserName").style.backgroundColor = "rgb(63, 62, 62)";
        } , 1000);
        document.getElementById("joinUserName").style.backgroundColor = "red";
    }
    else 
    socket.emit('joinRequest' , {
        roomId , name
    });
};

socket.on("joined" ,()=>{

    const userName = document.getElementById("joinUserName").value;

    currentRoom = document.getElementById("roomid").value;
    resDisplay.style.display = "block";
    resDisplay.innerHTML = currentRoom;
    document.getElementById("joinFacility").style.display = "none";
    createButton.style.display = "none";
    joinBox.style.display = "none";
    copyButton.style.display = "inline";

    usersList.push({
        name : userName , 
        id : currentRoom.slice(1) 
    });
    updateUsers();

});



socket.on("roomNotExists" , ()=>{
    setTimeout(()=>{
        document.getElementById("roomid").style.backgroundColor = "rgb(63, 62, 62)";
    } , 1000);
    document.getElementById("roomid").style.backgroundColor = "red";
});

socket.on("joinResult" , (data)=>{
    // console.log(data);
});



socket.on("newUser" , (obj)=>{
    usersList.push(obj);
    updateUsers();

    // console.log("we are here");

    document.getElementById("disconnectedUserName").innerHTML = obj.name;
    document.getElementById("joinOrLeft").innerHTML = "joined";
    document.getElementById("disconnectBox").style.display = "flex";

    setTimeout(()=>{
        document.getElementById("disconnectBox").style.display = "none";
    } , 1200);

});

socket.on("userDisconnected" , (userId)=>{
    removeId(userId);
});

function copyToClipboard()
{
    copyButton.innerText = "Copied";

    setTimeout(()=>{
        copyButton.innerText = "Copy";
    } , 1000);

    const copyText = resDisplay.innerText;

    navigator.clipboard.writeText(copyText);
}

socket.on("sendUsersToNewJoinedUsers" , (id)=>{
    // const usersListJson = JSON.stringify(usersList);
    let canvasJson = canvas.toJSON();

    let json = [usersList , canvasJson];
    json = JSON.stringify(json);
    // console.log("JSON -> " ,  json);

    socket.emit('sendDataTo' , {id , json});
});


socket.on("alreadyJoinedUsers" , (json)=>
{
    const data = JSON.parse(json);
    // console.log("we are here");
    // console.log(data);
    canvas.loadFromJSON(JSON.stringify(data[1]));
    let newUsersList = data[0];
    // newUsersList.push(usersList[0]);
    usersList = newUsersList;
    usersList.sort()
    updateUsers();
});




// Update 



const Second = document.getElementById("SECOND");
const header = document.getElementsByClassName("header");
const upDo = document.getElementById("upAndDownButton");



let secondHideStatus = false;

function hideSecond()
{
    // console.log("We are here");
    if(Second.style.display == "none")
    {
        Second.style.display = "flex";
        upDo.style.top = "135px";
        secondHideStatus = false;
    }
    else 
    {
        Second.style.display = "none";
        upDo.style.top = "75px";
        header.style.height = "50px";
        secondHideStatus = true;
    }
}



let penToggleValue = "none";
let eraserToggleValue = "none";


function penSizeToggle()
{   
    // console.log("secondHideStatus : " ,   secondHideStatus)

    if(penToggleValue === "none"){
        penToggleValue = "inline";

        if(eraserToggleValue=="inline")
            eraserSizeToggle();
    }

    else 
        penToggleValue = "none";
        
    document.querySelectorAll('.eraserContainer .penSize').forEach((element)=>{
                element.style.display  = penToggleValue;
    });


    if(Second.style.display != "none" && screen.width <= 960)
    {   
        hideSecond();
    }
}




async function eraserSizeToggle()
{       
    {
        setTimeout(async()=>{
    
            if(eraserToggleValue =="none")
            {
                eraserToggleValue = "inline";
                if(penToggleValue=="inline")
                    penSizeToggle();
            }
            else 
                eraserToggleValue = "none";

            document.querySelectorAll('.eraserContainer .rubber').forEach((element)=>{
                element.style.display  = eraserToggleValue;
            });
    
        }, 0.3);
    
        if(Second.style.display != "none" && screen.width <= 960)
        {   
            hideSecond();
        }

    }
}


const joinFacility = document.getElementById("joinFacility");
joinFacility.style.display = "none";

function openJoinFacility()
{
    joinFacility.style.display = "flex";
    createFacility.style.display = "none";
}

const createFacility = document.getElementById('createFacility');
createFacility.style.display = "none";

async function openCreateFacility()
{
    createFacility.style.display = "flex";
    joinFacility.style.display = "none";
}




// When clickint outside making the dispaly none of JOINFACILITY and CREATEFACILITY
function decide(event){
    if(event.target.id == "joinFacility" || event.target.id == "createFacility")
    {
        createFacility.style.display = "none";
        joinFacility.style.display = "none";
    }
};



const usersPage = document.getElementById('usersPageID');
usersPage.style.display = "none";

let userPageStatus = false;

function userPageToggle()
{
    // console.log("we are here");

    if(userPageStatus)
    {
        usersPage.style.display = "none";
        userPageStatus = false;
    }
    else 
    {
        usersPage.style.display = "flex";
        userPageStatus = true;
    }
}



function removeId(disconnedId)
{
    let newUsersList = [];
    for(let i = 0 ; i<usersList.length ; i++)
    {
        let obj = usersList[i];

        if(obj.id != disconnedId)
            newUsersList.push(obj);
        else 
        {
            document.getElementById("disconnectedUserName").innerHTML = obj.name;
            document.getElementById("joinOrLeft").innerHTML = "left";
            document.getElementById("disconnectBox").style.display = "flex";
            setTimeout(()=>{
                document.getElementById("disconnectBox").style.display = "none";
            } , 1200);
        }
    }
    usersList = newUsersList;
    updateUsers();
}


function updateUsers()
{
    let str = '';
    for(let i = 0 ; i<usersList.length ; i++)
    {
        const obj = usersList[i];
        if(obj.id == socket.id)
            str += `<div class="user"> <div> ${obj.name} (you) </div> </div>`;
        else 
            str += `<div class="user"> <div> ${obj.name} </div> </div>`;
    }
    usersPage.innerHTML = str;
}