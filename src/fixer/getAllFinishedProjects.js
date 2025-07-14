const AgentStatus = require("../models/AgentStatus");
const getAllFinishedProjects = async () => {
    try {
        const finishedProjects = await AgentStatus.find({
            isFinished: true,
            isActive: true
        }).distinct('projectId');

        const projectIdList = finishedProjects.map((project) => project.toString());
        return projectIdList;
    } catch (error) {
        
    }
}

module.exports = getAllFinishedProjects;