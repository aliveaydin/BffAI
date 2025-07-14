const ApproveAgent = require("../models/ApproveAgent");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getCoreConfig = async ({
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
        const microServiceName = "auth";

        const authApproveAgent = (await ApproveAgent.findOne({
            projectId,
            agent: "software-engineer",
            name: microServiceName,
            contentType: "defined_micro_service",
            success: true,
            status: "created",
            eventName: "software-engineer:design-microservice",
            isApproved: true,
            isActive: true
        })) || {extraInfo:'{}'};

        io.to(socketId).emit("core-config",
            JSON.stringify(
                JSON.parse(authApproveAgent?.extraInfo)
            )
        );

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "core-config-error"
        }));
    }
};

module.exports = getCoreConfig;