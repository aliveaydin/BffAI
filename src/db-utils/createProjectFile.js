const { client } = require('../../redis');
const getStreamData = require('../utils/getStreamData');
const ApproveAgent = require('../models/ApproveAgent');
const getScenerioStatus = require("../utils/getScenerioStatus")
const { notifyClients, createInitialApproveAgent, updateApproveAgent } = require('./projectFileHelpers');

const createProjectFile = async ({
    url,
    io,
    contentType,
    agent,
    ProjectFileName,
    projectId,
    userId,
    sendData = {},
    socketAgent,
    isApproved = false,
    saveData = true
}) => {
    try {
        let status = getScenerioStatus(agent, 0);
        const language = process.env.LANGUAGE || "tr";

        let message = {
            eventName: socketAgent,
            agent,
            name: ProjectFileName,
            type: "designing"
        };
        await notifyClients(projectId, userId, io, message);

        const approveAgentJson = await createInitialApproveAgent(projectId, agent, ProjectFileName, contentType, socketAgent, status);

        const reportData = await getStreamData({
            agent: socketAgent,
            url,
            method: 'POST',
            name: ProjectFileName,
            body: {
                stream: 1,
                project_id: projectId,
                ...sendData
            },
            io,
            socketAgent,
            userId,
            projectId
        });

        message = {
            eventName: socketAgent,
            agent,
            name: ProjectFileName,
            type: "created"
        };
        await notifyClients(projectId, userId, io, message);

        status = getScenerioStatus(agent, 1);

        if (saveData) {
            await updateApproveAgent(approveAgentJson, reportData, contentType, status, socketAgent, isApproved);
        }

        return reportData;

    } catch (error) {
        let clientSockets = await client.sMembers(`userSockets:${userId}`);
        try {
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('error', error.message);
                    }
                } catch (err) {
                    console.error("Socket parse error:", err);
                }
            }
            await ApproveAgent.findOneAndDelete({
                projectId,
                agent,
                name: ProjectFileName
            });
        } catch (err) {
            console.error("Error sending error message to client: ", err);
        }
    }
};

module.exports = createProjectFile;