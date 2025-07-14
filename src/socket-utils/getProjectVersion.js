const SystemService = require("../models/SystemService");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getProjectVersion = async ({
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
        let version = "1.0.0"

        const systemServices = (await SystemService.findOne({
            projectId,
        }))?.serviceList || [];


        for (const systemService of systemServices) {
            version = systemService.version;
            break;
        }
        

        io.to(socketId).emit("project-version",version);

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getProjectVersionError"
        }));
    }
};

module.exports = getProjectVersion;