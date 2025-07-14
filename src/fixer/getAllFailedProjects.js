const ApproveAgent = require('../models/ApproveAgent');
const getAllProjects = require('./getAllProjects');
const getAllFinishedProjects = require('./getAllFinishedProjects');

const getAllFailedProjects = async () => {
    try {
        const allProjects = await getAllProjects();
        const finishedProjects = await getAllFinishedProjects();
        const failedProjects = allProjects.filter(project => !finishedProjects.includes(project));
        const failedProjectList = failedProjects.map((project) => project.toString());
        return failedProjectList;
    } catch (error) {
        
    }
}

module.exports = getAllFailedProjects;