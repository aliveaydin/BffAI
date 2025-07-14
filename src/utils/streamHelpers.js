const { client } = require('../../redis');

async function processStream(reader, decoder, saveDataKey, projectId, agent, name, socketAgent, io) {
    let buffer = '';
    let totalData = "";

    let clientSockets = [];
    let checkCounter = 0;
    const CHECK_INTERVAL = 50;

    while (true) {
        if (checkCounter % CHECK_INTERVAL == 0) {
            const oldClientSockets = clientSockets;
            clientSockets = await client.sMembers(`userSockets:${userId}`);

            await client.zAdd(saveDataKey, {
                score: Date.now(),
                value: totalData
            });
            const newClientSockets = clientSockets.filter(socket => !oldClientSockets.includes(socket));
            if (newClientSockets.length > 0) {
                await notifyNewClients(newClientSockets, saveDataKey, projectId, agent, name, socketAgent, io);
            }

            totalData = "";
        }

        checkCounter++;

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let lines = buffer.split("\n");

        buffer = lines.pop();
        for (const line of lines) {
            const data = line.split("data: ");

            for (const dataPart of data) {
                if (dataPart.includes("content")) {
                    let parsed;
                    try {
                        parsed = JSON.parse(dataPart);
                    } catch (e) {
                        continue;
                    }
                    if (parsed?.content) {
                        totalData += parsed.content;
                        for (const socketId of clientSockets) {
                            try {
                                const socketData = JSON.parse(socketId);
                                if (projectId == socketData.projectId) {
                                    io.to(socketData.socketId).emit(agent, parsed.content);
                                }
                            } catch (err) {
                                console.log("Socket parse error:", err);
                            }
                        }
                    }
                }
            }
        }
    }
    if (checkCounter % CHECK_INTERVAL != 0) {
        clientSockets = await client.sMembers(`userSockets:${userId}`);
        await client.zAdd(saveDataKey, {
            score: Date.now(),
            value: totalData
        });

        totalData = "";
    }
    return (await client.zRange(saveDataKey, 0, -1))?.join("");
}

async function notifyNewClients(newClientSockets, saveDataKey, projectId, agent, name, socketAgent, io) {
    await new Promise((resolve) => {
        setTimeout(async () => {
            const allTotalData = (await client.zRange(saveDataKey, 0, -1))?.join("");
            if (allTotalData.length > 0) {
                for (const socketId of newClientSockets) {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                io.to(socketData.socketId).emit('log', JSON.stringify({
                                    eventName: socketAgent,
                                    agent,
                                    name,
                                    type: "designing"
                                }));
                                io.to(socketData.socketId).emit("document-history", allTotalData);
                                resolve();
                            }, 300);
                        });
                    }
                }
            }
            resolve();
        }, 200);
    });
}

module.exports = {
    processStream,
    notifyNewClients
};
