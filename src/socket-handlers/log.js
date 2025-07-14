const getLastLog = require("../socket-utils/getLastLog");

async function log(socket, io) {
    socket.on("log", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getLastLog({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching log:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the log.");
        }
    });
}

module.exports = log;
