const ApproveAgent = require('../models/ApproveAgent');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');
const getApproveListFromUtils = require('../utils/getApproveList');

const getApproveList = async ({
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

        const approvedList = await getApproveListFromUtils(projectId) || [];

        io.to(socketId).emit("approve-list", approvedList);
    } catch (error) {
        console.log("approvelisterror")
        console.log(error)
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "approvelisterror"
        }));
    }
}

module.exports = getApproveList;