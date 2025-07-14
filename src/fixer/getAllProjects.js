const ApproveAgent = require('../models/ApproveAgent');

const getAllProjects = async () => {
    try {
        const finishedProjects = await ApproveAgent.find({
            isActive: true
        }).distinct('projectId');

        const projectIdList = finishedProjects.map((project) => project.toString());
        return projectIdList;
    } catch (error) {
        
    }
}

module.exports = getAllProjects;