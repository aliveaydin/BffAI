const getChatLastLog = require("../socket-utils/getChatLastLog");

async function chatLastLog(socket, io) {
    socket.on("chat-log", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getChatLastLog({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching chat log:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the chat log.");
        }
    });
}

module.exports = chatLastLog;
