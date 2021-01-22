const Dao = require("../utilities/Dao.js");

module.exports = {

    // get room if not found create one
  // async getUserRoomOrCreateOne(authUserId, user_id) {
  //findOrCreateUserRoom([userids])
  // },

  async getUserRoom(room_id) {
    const sql = `select * from room_master where id=${room_id}`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  async saveRoomMessage({ room_id, user_id, message, message_type }) {
    const sql = `insert into room_messages(room_id, user_id, message ,created_at, updated_at) 
        values(${room_id}, ${user_id}, "${message.replace(
      /"/g,
      ""
    )}",now(), now())`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  async getUserMessages(room_id, page_no) {
    const sql = `select rm.id, rm.room_id, rm.user_id, rm.message  , rm.created_at , rm.updated_at, usr.name from room_messages rm, user usr WHERE rm.room_id = ${room_id} AND rm.user_id = usr.id ORDER BY rm.id desc LIMIT ${
      (page_no - 1) * 40
    } ,40`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  async updUserSocketId(userId, socketId) {
    console.log("params", userId, socketId);
    const sql = `update user set socket_id = '${socketId}' where id=${userId}`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  async getUserSocketId(userId) {
    const sql = `select socket_id from user where id = ${userId}`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  async roomWiseUser(room_id) {
    const sql = `SELECT usr.name,usr.id , usr.socket_id FROM room_detail rd, user usr WHERE rd.room_id=${room_id}
        AND rd.user_id = usr.id`;
    const res = await Dao.executeQuery(sql);
    return res;
  },

  //api call
  //use this to get users chat or grp chat 
  async userChatHistory({ user_id, page_no }) {
    const page = page_no || 1;

    try {
      const usrRooms = await Database.raw(
        `SELECT usr.id ,usr.name, m.room_id , m.message ,
         m.created_at , m.updated_at from room_messages m LEFT 
         JOIN room_messages b ON m.room_id = b.room_id AND m.created_at
          < b.created_at INNER JOIN room_detail rd ON m.room_id = rd.room_id INNER JOIN 
          user usr ON usr.id = IF(m.user_id = ${user_id}, rd.user_id,m.user_id) 
          WHERE b.created_at IS NULL AND rd.user_id != m.user_id AND m.room_id 
          IN (SELECT room_id FROM room_detail WHERE user_id =${user_id} ) 
          ORDER BY m.created_at DESC`
      );
      return usrRooms[0];
    } catch (error) {
      console.log(error);
      return false;
    }
  },
};
