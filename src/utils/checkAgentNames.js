const checkAgentNames = (agentName) => {
    const agentNames = ["project-manager", "business-analyst", "software-architect","software-engineer"];
    return agentNames.includes(agentName);
};

module.exports = checkAgentNames;