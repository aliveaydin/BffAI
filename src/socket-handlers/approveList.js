const getApproveList = require("../socket-utils/getApproveList");

async function approveList(socket, io) {
    socket.on("approve-list", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;

            await getApproveList({
                email,
                userId,
                token,
                projectId,
                io,
                socketId
            });

        } catch (error) {
            console.error("Error while fetching the approve list:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the approve list.");
        }
    });
}

module.exports = approveList;
