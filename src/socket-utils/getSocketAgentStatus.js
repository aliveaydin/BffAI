const ApproveAgent = require('../models/ApproveAgent');
const getAgentStatus = require("../utils/getAgentStatus");

const getSocketAgentStatus = async ({
    projectId,
    io,
    socketId
}) => {
    try {
        if (!projectId) {
            throw new Error("Project ID is required");
        }
        
        const currentAgent = (await ApproveAgent.findOne({
            projectId
        }).sort({ createdAt: -1 }))?.agent;



        const agentStatus = await getAgentStatus(projectId,currentAgent);
        io.to(socketId).emit('agent-status', agentStatus);
    } catch (error) {
        console.error(error);
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getSocketAgentStatusError"
        }));
    }
}

module.exports = getSocketAgentStatus;