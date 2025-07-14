const { client } = require('../../redis');
const getStreamData = require('../utils/getStreamData');
const ApproveAgent = require('../models/ApproveAgent');
const getScenerioStatus = require("../utils/getScenerioStatus")
const getApproveList = require("../utils/getApproveList");
const getAndSaveRandomLogMessage = require("../utils/getAndSaveRandomLogMessage");
const getLastLog = require("../socket-utils/getChatLastLog");

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
        console.log(7)
        let status = getScenerioStatus(agent, 0);
        const language = process.env.LANGUAGE || "tr";

        let clientSockets = await client.sMembers(`userSockets:${userId}`);
        const approveAgentJson = {
            projectId,
            agent,
            name: ProjectFileName
        }
        console.log(8)

        const checkIsAlreadyCreated = await ApproveAgent.findOne(approveAgentJson);
        if (checkIsAlreadyCreated) throw new Error(`${ProjectFileName} is already created`);

        let message = {
            eventName: socketAgent,
            agent,
            name: ProjectFileName,
            type: "designing"
        };
        let randomMessage = await getAndSaveRandomLogMessage({
            projectId,
            language,
            agent: socketAgent,
            status:"begin",
            extraMessage:message
        });
        console.log(9)
        for (const socketId of clientSockets) {
            try {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit('log', JSON.stringify({
                        ...message,
                        message: randomMessage.message,
                        status: randomMessage.status
                    }));
                    await getLastLog({
                        io,
                        socketId: socketData.socketId,
                        projectId,
                    })
                }
            } catch (err) {
                console.log("Socket parse error:", err);
            }
        }
        console.log(10)
        let approveAgent = new ApproveAgent({
            ...approveAgentJson,
            jsonBody: "{}",
            contentType,
            eventName: socketAgent,
            status: status ? status : "designing",
            isApproved: false
        });

        if(agent != "software-architect"){
            await approveAgent.save();

            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        const approveList = await getApproveList(projectId);
                        approveList.eventName = socketAgent
                        io.to(socketData.socketId).emit('approve-list', approveList);
                    }
                }
                catch (err) {
                    console.log("Socket parse error:", err);
                }
            }
        }
        console.log(11)
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
        console.log(16)
        clientSockets = await client.sMembers(`userSockets:${userId}`);

        message = {
            eventName: socketAgent,
            agent,
            name: ProjectFileName,
            type: "created"
        };
        randomMessage = await getAndSaveRandomLogMessage({
            projectId,
            language,
            agent: socketAgent,
            status:"end",
            extraMessage:message
        });
        console.log(17)
        for (const socketId of clientSockets) {
            try {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit('log', JSON.stringify({
                        ...message,
                        message: randomMessage.message,
                        status: randomMessage.status
                    }));
                    await getLastLog({
                        io,
                        socketId: socketData.socketId,
                        projectId,
                    })
                }
            } catch (err) {
                console.log("Socket parse error:", err);
            }
        }
        console.log(18)
        status = getScenerioStatus(agent, 1);

        if (saveData) {
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
        console.log(19)
        return reportData;

    } catch (error) {
        console.log(error);
        let clientSockets = await client.sMembers(`userSockets:${userId}`);
        try {
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('error', error.message);
                    }
                } catch (err) {
                    console.log("Socket parse error:", err);
                }
            }
            await ApproveAgent.findOneAndDelete({
                projectId,
                agent,
                name: ProjectFileName
            });
        } catch (err) {
            console.log("Error sending error message to client: ", err);
        }

    }
};

module.exports = createProjectFile;