const scenerio = require("../scenerio.json");

const getScenerioStatus = (agent, arrayNumber = 0) => {
    const found = scenerio.agents.find(obj => obj.hasOwnProperty(agent));
    if (found) {
        return found.statuses[arrayNumber];
    }
    return null;
};

module.exports = getScenerioStatus;
