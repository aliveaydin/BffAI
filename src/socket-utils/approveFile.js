const ApproveAgent = require('../models/ApproveAgent');

const approveFile = async ({
    projectId,
    ProjectFileName,
    agent,
    io,
    socketId
}) => {
    try {
        const isReportApproved = await ApproveAgent.findOne({ projectId, agent, name: ProjectFileName, isActive: true });

        if (!isReportApproved) throw new Error("File not found");
        if (isReportApproved.isApproved == true) throw new Error(`${ProjectFileName} is already approved`);

        await isReportApproved.updateOne({ isApproved: true });

        io.to(socketId).emit("approve", `${ProjectFileName} is approved`);

        return isReportApproved;
    } catch (error) {
        console.error(error);
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "Error approving file"
        }));
    }
}

module.exports = approveFile;