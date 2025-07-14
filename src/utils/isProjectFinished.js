const AgentStatus = require("../models/AgentStatus");

const isProjectFinished = async (projectId) => {
    try {
        const isFinished = await AgentStatus.findOne({
            projectId: projectId,
            isFinished: true
        });

        if (isFinished) {
            return true;
        }

        return false;
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = isProjectFinished;