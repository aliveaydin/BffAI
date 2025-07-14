const ApproveAgent = require('../models/ApproveAgent');
const getApproveList = require('./getApproveList');

const autoApprove = async ({ projectId, agent, ProjectFileName, success = true, io = false, userId, client }) => {
    try {
        const isReportApproved = await ApproveAgent.findOne({ projectId, agent, name: ProjectFileName, isActive: true });

        if (!isReportApproved) throw new Error("File not found");
        if (isReportApproved.isApproved == true) throw new Error(`${ProjectFileName} is already approved`);

        await isReportApproved.updateOne({
            success,
            isApproved: true
        });

        const getAgentStatus = require("./getAgentStatus");
        const agentStatus = await getAgentStatus(projectId, agent);

        if (io) {
            const approveList = await getApproveList(projectId);
            let clientSockets = await client.sMembers(`userSockets:${userId}`);
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('approve-list', approveList);
                        io.to(socketData.socketId).emit('agent-status', agentStatus);
                    }
                }
                catch (err) {
                    console.log("Socket parse error:", err);
                }
            }
        }

        return true;
    } catch (error) {
        console.error({error});
        return false;
    }
}

module.exports = autoApprove;