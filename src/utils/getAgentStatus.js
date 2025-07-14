const scenerio = require("../scenerio.json");
const AgentStatus = require("../models/AgentStatus");

const getAgentStatus = async (projectId,agent) => {
    try {
        const agentStatus = {};
        let found = false;

        const isFinished = await AgentStatus.findOne({
            projectId: projectId,
            isFinished: true
        });

        let isFirstAgent = true;
        for (const scenerioAgent of scenerio.agents) {
            let role = Object.keys(scenerioAgent)[0];
            if(isFinished){
                agentStatus[role] = "done";
                continue;
            }

            if(!agent){
                agentStatus[role]="idle";
                if(isFirstAgent){
                    agentStatus[role]="active";
                    isFirstAgent = false;
                }
                continue;
            }

            if (role == agent) {
                agentStatus[role] = "active";
                found = true;
            } else {
                agentStatus[role] = found ? "idle" : "done";
            }
        }



        return JSON.stringify(agentStatus);
    } catch (error) {
        console.log(error)
    }
}

module.exports = getAgentStatus;