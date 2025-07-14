const getCoreConfig = require("../socket-utils/getCoreConfig");

async function coreConfig(socket, io) {
    socket.on("core-config", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getCoreConfig({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching core config:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the core config.");
        }
    });
}

module.exports = coreConfig;
