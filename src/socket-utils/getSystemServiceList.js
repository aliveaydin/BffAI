const SystemService = require("../models/SystemService")
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getSystemServiceList = async ({
    projectId,
    email,
    userId,
    token,
    io,
    socketId
}) => {
    try {
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission!=true) throw projectAndPermission;


        const services = (await SystemService.findOne({
            projectId: projectId
        }))?.serviceList || [];

        if (!services) throw new Error("No system service list found");
        io.to(socketId).emit("system-service-list", services);

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getSystemServiceListError"
        }));
    }
};

module.exports = getSystemServiceList;