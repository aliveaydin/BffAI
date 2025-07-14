const { client } = require('../../redis');
const getApproveList = require('../utils/getApproveList');

const getStreamData = async ({ agent, name, url, method = 'POST', body = {}, io, userId, projectId, clientSockets, socketAgent }) => {
    try {
        console.log(12)
        const saveDataKey = `savedData:${projectId}:${name}`;

        const formData = new FormData();
        Object.keys(body).forEach(key => {
            formData.append(key, body[key]);
        });

        console.log({
            url,
            body
        })
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        console.log({
            response
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error(`HTTP Error: ${response.status}`, errorData || "Sunucudan detaylı hata mesajı gelmedi.");
            return;
        }
        console.log(13)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';

        let totalData = "";
        // let index = false;

        let clientSockets = [];
        let checkCounter = 0;
        const CHECK_INTERVAL = 50;
        console.log(14)
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

                    await new Promise((resolve) => {
                        setTimeout(async() => {
                            const allTotalData = (await client.zRange(saveDataKey, 0, -1))?.join("");
                            if (allTotalData.length > 0) {
               
        
                                for (const socketId of newClientSockets) {
                                    const socketData = JSON.parse(socketId);
                                    if (projectId == socketData.projectId) {
                                        await new Promise((resolve) => {
                                            setTimeout(() => {
                                                io.to(socketData.socketId).emit('log', JSON.stringify({
                                                    eventName:socketAgent,
                                                    agent,
                                                    name,
                                                    type:"designing"
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

                totalData = "";
            }

            checkCounter++;
            // if (!index && name) {
            //     for (const socketId of clientSockets) {
            //         try {
            //             const socketData = JSON.parse(socketId);
            //             if (projectId == socketData.projectId) {
            //                 io.to(socketData.socketId).emit(agent, name);
            //             }
            //         } catch (err) {
            //             console.log("Socket parse error:", err);
            //         }
            //     }

            //     index = true;
            // }
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
        console.log(15)
        totalData = (await client.zRange(saveDataKey, 0, -1))?.join("");
        console.log({
            totalData
        })
        return totalData;

    } catch (error) {
        console.log({error});
        if (clientSockets) {
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('error', JSON.stringify({
                            error: error.message,
                            "reason": "Service fetch error from this url " + url
                        }));
                    }
                } catch (err) {
                    console.log("get stream hatası")
                    console.error("Socket parse error:", err);
                }
            }
        }
        console.log("getStreamData", error)
        throw error;
    }
};

module.exports = getStreamData;
