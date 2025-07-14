const { client } = require("../../redis");

function disconnect(socket, io) {
    socket.on("disconnect", async () => {
        const socketId = socket.id;
        try {
            // Socket ID'den kullanıcıyı bul
            const userId = await client.hGet("socketUser", socketId);

            if (userId) {
                const members = await client.sMembers(`userSockets:${userId}`);
                for (const member of members) {
                    try {
                        const parsed = JSON.parse(member);
                        if (parsed.socketId === socketId) {
                            await client.sRem(`userSockets:${userId}`, member);
                            continue;
                        }
                    } catch (err) {
                        console.error("Invalid JSON:", member);
                    }
                }

                await client.hDel("socketUser", socketId);

                const remainingSockets = await client.sCard(`userSockets:${userId}`);
                if (remainingSockets === 0) {
                    await client.del(`userSockets:${userId}`);
                    console.log(`User fully disconnected: ${userId}`);
                }

                console.log(`User disconnected: ${userId} -> ${socketId}`);
            }
        } catch (error) {
            console.error("Error during disconnect:", error);
        }
    });
}

module.exports = disconnect;
