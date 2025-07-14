const getSocketAgentStatus = require("../socket-utils/getSocketAgentStatus");

async function agentStatus(socket, io) {
    socket.on("agent-status", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;

            await getSocketAgentStatus({
                projectId,
                io,
                socketId
            });

        } catch (error) {
            console.error("Error while fetching agent status:", error);
            io.to(socketId).emit("error", "An error occurred while fetching the agent status.");
        }
    });
}

module.exports = agentStatus;
