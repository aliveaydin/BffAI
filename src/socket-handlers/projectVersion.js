const getProjectVersion = require("../socket-utils/getProjectVersion");

async function projectVersion(socket, io) {
    socket.on("project-version", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getProjectVersion({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching project version:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the project version.");
        }
    });
}

module.exports = projectVersion;
