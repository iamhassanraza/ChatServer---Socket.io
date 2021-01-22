 <b>
 <h2> Readymade Node/express + Socket.io Server with MYSQL Database </h2> </b> 


<h3> Installation </h3> 

* npm install
* import sqlfile in the root to your database


<h3> USAGE </h3>


STEPS
CLIENT 
1) User Calls an event "isLoggedIn"

<code> 

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
 </code>
 This will update the socketid to the current user extracted by token

 
2) User fetch chat history along with room_id i.e all the users he has chatted with

3) User Opens a Chat or Create a New one with new users, either way he gets room_id
    
    <code>
      User will send array of [user_ids] whom he wants to create a group chat
      if the room exists with these user ,he will get room id
      else create a room and return room id
    </code>

4) User calls an event "joinRoom" when he opens the chatmessage screen (i.e: the one with messages)

  <code>

      socket.on("joinRoom", async ({ room_id, page_no }) => {
      if (parseInt(page_no) === 1) {
        socket.join(room_id);
      }
      
      const usrMsg = await roomService.getUserMessages(room_id, page_no);
      io.to(socket.id).emit("joinRoom", usrMsg);
    });


  </code>
 
 this will send back messages with pagination.
  
  5) User also listens to an event "joinRoom" on which he will get the last 40 messages of that room/chat.
  
  6) User types a message and send in the callback function of the event <b> "message" </b>
  
  7) Server is listening to the event "message" as
  
 <code>
 
           socket.on("message", async (usrMessage) => {

          try {
            const { message, room_id } = usrMessage;

            const room = io.sockets.adapter.rooms;
            var sockId = "";

            //getting all users in the room given by current user
            var allUsersInRoomArray = await roomService.roomWiseUser(room_id);


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

 </code>
  
  8) User also listens to the event <b> "message" </b> , all users who are currently in the room will recieve the message object
      the rest of the users can be sent pushnotification / or anyother eventNotification 
  
  
  9) User closes the app / disconnects anyhow,
  the default event "disconnect" will be called automatically and on server side we will remove the socket_id
  against user in the database: user's table
  
  
 <code>
    
       socket.on("disconnect", async (reason) => {
        console.log("Disconnect Reason : ", reason);

        await roomService.updUserSocketId(user_id, null);
      });
    
 </code>
  
  
  10) If users contain socket id it means he is Online otherwise he is offline
  
