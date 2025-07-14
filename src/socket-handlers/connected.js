const { client } = require("../../redis");
const isProjectFinished = require("../utils/isProjectFinished");
const isProjectStarted = require("../utils/isProjectStarted");
const getProjectVersion = require("../socket-utils/getProjectVersion");

async function connected(socket, io) {
    try {
        const userId = socket.userId;
        const socketId = socket.id;
        const projectId = socket.projectId;
        const email = socket.email;
        const token = socket.token;

        if (!userId) {
            console.log(`⚠️ User ID is missing! Socket: ${socketId}`);
            return;
        }

        if (!projectId) {
            console.log(`⚠️ Project ID is missing! Socket: ${socketId}`);
            return;
        }

        await client.sAdd(`userSockets:${userId}`, JSON.stringify({ socketId, projectId }));
        await client.hSet("socketUser", socketId, userId);

        const isProjectFinishedStatus = await isProjectFinished(projectId);

        if(isProjectFinishedStatus){
            io.to(socketId).emit("log",
                JSON.stringify({
                    type: "finished"
                })
            );
        }
        if(!isProjectFinishedStatus){
            const isProjectStartedStatus = await isProjectStarted(projectId);
            if(isProjectStartedStatus){
                io.to(socketId).emit("log",
                    JSON.stringify({
                        type: "started"
                    })
                );
            } else {
                io.to(socketId).emit("log",
                    JSON.stringify({
                        type: "not-started"
                    })
                );
            }
        }

        await getProjectVersion({
            projectId,
            email,
            userId,
            token,
            io,
            socketId
        });

    } catch (error) {
        console.error("Error during connection:", error);
    }
}

module.exports = connected;
