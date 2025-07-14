const Logs = require("../models/Logs");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getLogs = async ({
    projectId,
    email,
    userId,
    token,
    io,
    socketId
}) => {
    try {
        if(email && userId && token){
            const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
            if (projectAndPermission!=true) throw projectAndPermission;
        }

        const logList = ((await Logs.findOne({ projectId }))?.logList || []).map(log => {
            return JSON.parse(log)
        });
        

        io.to(socketId).emit("chat-log-history",logList);

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getLastLogError3"
        }));
    }
};

module.exports = getLogs;