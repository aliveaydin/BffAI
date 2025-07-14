const getAllFailedProjects = require("./getLastStepOfFailedProjects");

const fixer = async () => {
    const finishedprojects = await getAllFailedProjects();
    console.log("getLastStepOfFailedProjects", finishedprojects);
    

}

module.exports = fixer;