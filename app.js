const express = require("express");
const app = express();
const router = require("./routes/router.js");
const path = require("path");
const port = process.env.PORT || 3000;
const healthCheckTimeInterval = 1000 * 60 * 10;

setInterval(async () => {
  try {
    const res = await fetch("https://acetype.onrender.com/healthcheck");
    console.log({ res });
  } catch (err) {
    console.log("Some error occured");
  }
}, healthCheckTimeInterval);

// require('./Database/connect');

// Socket.IO
const http = require("http").Server(app);
const io = require("socket.io")(http);

// Paths
const viewsPath = path.join(__dirname, "./templates/views");
const publicPath = path.join(__dirname, "./public");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// routing
app.use(express.static(publicPath));

app.set("view engine", "hbs");
app.set("views", viewsPath);

app.use(router);

http.listen(port, () => {
  console.log("Server is running at 3000...");
});

const map = new Map();

// Socket Code
io.on("connect", async (socket) => {
  // console.log('A User connected');

  socket.on("createRoom", async () => {
    // console.log("create request");
    let idn = "a" + socket.id;
    // console.log(idn);
    map[socket.id] = idn;
    await socket.join(idn);
    await socket.emit("createResult", idn);
  });

  socket.on("joinRequest", async (obj) => {
    // console.log("joining request");
    const roomName = obj.roomId;
    map[socket.id] = roomName;
    const name = obj.name;

    if (io.sockets.adapter.rooms.has(roomName)) {
      // console.log("successfull join request , joined");
      socket.join(roomName);
      socket.emit("joined");
      socket.to(roomName).emit("newUser", {
        name: name,
        id: socket.id,
      });

      const creatorId = roomName.slice(1);
      // console.log("creatorId  : " + creatorId);

      // const alreadyJoinedUser =
      io.to(creatorId).emit("sendUsersToNewJoinedUsers", socket.id);
    } else {
      // console.log("Room don't exists");
      socket.emit("roomNotExists");
    }
  });

  socket.on("sendDataTo", ({ id, json }) => {
    // console.log(json);
    io.to(id).emit("alreadyJoinedUsers", json);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");
    socket.to(map[socket.id]).emit("userDisconnected", socket.id);
  });

  await socket.on("newElement", async ({ room, element }) => {
    if (io.sockets.adapter.rooms.has(room)) {
      await socket.to(room).emit("newElement", element);
      // console.log('');
      // console.log("new Element");
      // console.log(room);
    } else {
      // console.log('');
      // console.log(room);
      // console.log("Roome not exists , but element added");
    }
  });

  await socket.on("clearCanvas", async ({ room }) => {
    await socket.to(room).emit("clearCanvas");
  });

  await socket.on("undo", async ({ room }) => {
    await socket.to(room).emit("undo");
  });

  await socket.on("redo", async ({ room }) => {
    await socket.to(room).emit("redo");
  });
});
