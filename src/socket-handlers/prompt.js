const promptMessage = require("../socket-utils/promptMessage");

async function prompt(socket, io) {
    socket.on("prompt", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const prompt = data.prompt;
            const email = socket.email;
            const token = socket.token;
            const isAuto = data.isAuto || true;

            await promptMessage({
                projectId,
                email,
                userId,
                token,
                isAuto,
                prompt,
                io,
                socketId
            });

        } catch (error) {
            console.error("Error during prompt process:", error);
            io.to(socketId).emit("error", "An error occurred during the prompt process.");
        }
    });
}

module.exports = prompt;
