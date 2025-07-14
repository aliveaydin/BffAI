const approveFile = require("../socket-utils/approveFile");

async function approve(socket, io) {
    socket.on("approve", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const ProjectFileName = data.ProjectFileName;
            const agent = data.agent;

            const approvedFile = await approveFile({
                projectId,
                agent,
                ProjectFileName,
                io,
                socketId
            });

            io.to(socketId).emit("approved", approvedFile);

        } catch (error) {
            console.error("Error during approve process:", error);
            io.to(socketId).emit("error", "An error occurred during the approve process.");
        }
    });
}

module.exports = approve;
