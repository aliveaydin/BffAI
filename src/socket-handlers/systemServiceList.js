const getSystemServiceList = require("../socket-utils/getSystemServiceList");

async function systemServiceList(socket, io) {
    socket.on("system-service-list", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getSystemServiceList({
                projectId,
                socketId,
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Error while fetching system service list:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the system service list.");
        }
    });
}

module.exports = systemServiceList;
