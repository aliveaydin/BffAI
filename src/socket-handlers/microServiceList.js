const getMicroServiceList = require("../socket-utils/getMicroServiceList");
const fixServiceListSorting = require("../utils/fixServiceListSorting");

async function microServiceList(socket, io) {
    socket.on("service-list", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const email = socket.email;
            const token = socket.token;
            const serviceList = await getMicroServiceList({
                projectId,
                email,
                userId,
                token,
                io,
                socketId
            });
            io.to(socketId).emit("service-list", fixServiceListSorting(serviceList));
        } catch (error) {
            console.error("Error while fetching service list:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the service list.");
        }
    });
}

module.exports = microServiceList;
