const { client } = require('../../redis');
const { processStream } = require('./streamHelpers');

const getStreamData = async ({ agent, name, url, method = 'POST', body = {}, io, userId, projectId, clientSockets, socketAgent }) => {
    try {
        const saveDataKey = `savedData:${projectId}:${name}`;

        const formData = new FormData();
        Object.keys(body).forEach(key => {
            formData.append(key, body[key]);
        });

        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        return await processStream(reader, decoder, saveDataKey, projectId, agent, name, socketAgent, io);

    } catch (error) {
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
                    console.error("Socket parse error:", err);
                }
            }
        }
        throw error;
    }
};

module.exports = getStreamData;
