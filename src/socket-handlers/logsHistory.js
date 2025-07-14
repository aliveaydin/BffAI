const getLogs = require("../socket-utils/getLogs");

async function logsHistory(socket, io) {
    socket.on("chat-log-history", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getLogs({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching logs:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the logs.");
        }
    });
}

module.exports = logsHistory;
