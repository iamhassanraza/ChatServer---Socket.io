require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app = express();
const server = http.createServer(app);
const io = require("socket.io").listen(server);
global.io = io;
const socketEvents = require("./src/utilities/socketEvents")(io);

server.listen(process.env.PORT || 80);

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// app.get('/chatHistory',()=>{
//     //add this method in roomservice
//     // roomService.getChathistory()
// })

// app.post('/findOrCreateRoom',({user_id_array})=>{
//     // roomService.findOrCreateRoom()
// })

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status = error.status || 500;
  res.json({
    error: {
      message: error.message,
    },
  });
  next(error);
});
