const getLastStepOfFailedProjects = require("./getLastStepOfFailedProjects");
const ApproveAgent = require('../models/ApproveAgent');
const softwareEngineer = require('../route-utils/softwareEngineer');

const fixer = async () => {
    const failedProjects = await getLastStepOfFailedProjects();
    
    for (const project of failedProjects) {
        const { projectId, agent, name } = project;

        if (agent === 'software-engineer') {
            console.log(`Retrying software engineer step for project ${projectId}, service ${name}`);
            try {
                await softwareEngineer({
                    req: { params: { projectId }, body: { microServiceName: name } },
                    res: {},
                    next: () => {},
                    io: {},
                    isAuto: true
                });
            } catch (error) {
                console.error(`Error retrying software engineer step for project ${projectId}, service ${name}:`, error);
            }
        }
    }
}

module.exports = fixer;