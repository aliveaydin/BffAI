const Logs = require("../models/Logs");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getLastLog = async ({
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

        const logList = (await Logs.findOne({ projectId }))?.logList || [];
        const lastLog = logList[logList.length - 1];

        io.to(socketId).emit("log",lastLog);

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getLastLogError2"
        }));
    }
};

module.exports = getLastLog;