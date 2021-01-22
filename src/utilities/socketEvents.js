const roomService = require("../services/roomService.js");
const constants = require("../utilities/constants.js");
const jwt = require("jsonwebtoken");
const R = require("ramda");

module.exports = function (io) {
  io.on("connection", function (socket) {
    console.log(
      "connection made => socket = ",
      socket.id,
      "== user_id ==>",
      socket.handshake.query.id
    );

    var user_id = parseInt(socket.handshake.query.id);

    socket.on("isLoggedIn", async () => {
      try {
        console.log("isLoggedIn");

        await roomService.updUserSocketId(user_id, socket.id);
        io.to(socket.id).emit("isLoggedIn", true);
      } catch (exp) {
        console.log(exp);
        io.to(socket.id).emit("isLoggedIn", false);
      }
    });

    socket.on("joinRoom", async ({ room_id, page_no }) => {
      //this event fires when user opens the chatscreen / roomscreen
      // fetch the messages from room_id and send back to user

      if (parseInt(page_no) === 1) {
        //creats your socekt entry in the room
        //room me jo jo hoga means chatscreen kholi hwi usne

        socket.join(room_id);
      }

      const usrMsg = await roomService.getUserMessages(room_id, page_no);
      io.to(socket.id).emit("joinRoom", usrMsg);
    });

    socket.on("message", async (usrMessage) => {
      try {
        const { message, room_id } = usrMessage;

        const room = io.sockets.adapter.rooms;
        // console.log("io.sockets.adapter.rooms ", room);
        // console.log("io.sockets.adapter.rooms[room_id] ", room[room_id]);

        var sockId = "";

        //getting all users in the room given by current user
        var allUsersInRoomArray = await roomService.roomWiseUser(room_id);
        console.log(allUsersInRoomArray, "all users in room");

        //getting current user by matching socket id
        const usr = allUsersInRoomArray.find((soc) =>
          R.equals(socket.id, soc.socket_id)
        );

        //getting all other users users
        var sock = allUsersInRoomArray.filter(
          (soc) => !R.equals(socket.id, soc.socket_id)
        );
        console.log("getting all other users users", sock);

        // with room[room_id].length you can find out how many people have open chat screen / currently on chat screen

        //  ADD CONTITION:  it may be possible that users are online but room join nahi kia hwa
        //  matlab , socket_id exist krti hai db me users k against but wo room me nahi hian
        //  in that case alag se koi event fire kr skte ya push notification fire kr skte un users pe
        // if room[room_id].length == grpmembers means koi na koi offline hai , send them push notification or mobileNotification
        io.to(room_id).emit("message", [usrMessage]);

        //save that msg in db
        await roomService.saveRoomMessage({
          room_id,
          user_id,
          message: usrMessage.message,
        });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on("disconnect", async (reason) => {
      console.log("Disconnect Reason : ", reason);

      await roomService.updUserSocketId(user_id, null);
    });

    socket.on("error", (error) => {
      console.log("error", error);
    });
  });
};
