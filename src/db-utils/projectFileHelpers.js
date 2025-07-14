const { client } = require('../../redis');
const ApproveAgent = require('../models/ApproveAgent');
const getApproveList = require("../utils/getApproveList");
const getAndSaveRandomLogMessage = require("../utils/getAndSaveRandomLogMessage");
const getLastLog = require("../socket-utils/getChatLastLog");

async function notifyClients(projectId, userId, io, message) {
    let clientSockets = await client.sMembers(`userSockets:${userId}`);
    for (const socketId of clientSockets) {
        try {
            const socketData = JSON.parse(socketId);
            if (projectId == socketData.projectId) {
                io.to(socketData.socketId).emit('log', JSON.stringify(message));
                await getLastLog({
                    io,
                    socketId: socketData.socketId,
                    projectId,
                });
            }
        } catch (err) {
            console.log("Socket parse error:", err);
        }
    }
}

async function createInitialApproveAgent(projectId, agent, ProjectFileName, contentType, socketAgent, status) {
    const approveAgentJson = {
        projectId,
        agent,
        name: ProjectFileName
    };

    const checkIsAlreadyCreated = await ApproveAgent.findOne(approveAgentJson);
    if (checkIsAlreadyCreated) throw new Error(`${ProjectFileName} is already created`);

    let approveAgent = new ApproveAgent({
        ...approveAgentJson,
        jsonBody: "{}",
        contentType,
        eventName: socketAgent,
        status: status ? status : "designing",
        isApproved: false
    });

    if (agent != "software-architect") {
        await approveAgent.save();
    }
    return approveAgentJson;
}

async function updateApproveAgent(approveAgentJson, reportData, contentType, status, socketAgent, isApproved) {
    await ApproveAgent.findOneAndUpdate(
        approveAgentJson,
        {
            $set: {
                jsonBody: reportData,
                contentType,
                status: status ? status : "created",
                eventName: socketAgent,
                isApproved
            }
        },
        { new: true, upsert: false }
    );
}

module.exports = {
    notifyClients,
    createInitialApproveAgent,
    updateApproveAgent
};
