const getChatHistory = require('../socket-utils/getChatHistory');

async function messageHistory(socket, io) {
    socket.on("message-history", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const agent = data.agent;
            const email = socket.email;
            const token = socket.token;

            await getChatHistory({
                projectId,
                email,
                userId,
                token,
                agent,
                io,
                socketId
            });

        } catch (error) {
            console.error("Error while fetching message history:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the message history.");
        }
    });
}

module.exports = messageHistory;
