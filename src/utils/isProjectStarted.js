const AgentStatus = require("../models/AgentStatus");

const isProjectStarted = async (projectId) => {
    try {
        const isStarted = await AgentStatus.findOne({
            projectId: projectId,
            isStarted: true
        });

        if (isStarted) {
            return true;
        }

        return false;
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = isProjectStarted;