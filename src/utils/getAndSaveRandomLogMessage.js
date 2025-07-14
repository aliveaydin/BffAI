const randomMessages = require("../randomMessages.json");
const Logs = require("../models/Logs");

const getAndSaveRandomLogMessage = async ({
    projectId,
    language,
    agent,
    status,
    extraMessage
}) => {
    const languageMessage = randomMessages[language];
    const agentMessage = languageMessage?.[agent];
    const messageList = agentMessage?.[status];

    if (!Array.isArray(messageList) || messageList.length == 0) {
        return extraMessage;
    }

    const randomIndex = Math.floor(Math.random() * messageList.length);
    const oldLogList = (await Logs.findOne({
        projectId,
        isActive: true
    }))?.logList || [];

    const name = extraMessage?.name || "";
    const message = messageList[randomIndex]?.replace(/{{service_name}}/gi, name);
    const newLogList = [...oldLogList, JSON.stringify({
        ...extraMessage,
        message: message,
        status,
    })];

    await Logs.findOneAndUpdate(
        { projectId, isActive: true },
        { logList: newLogList },
        { upsert: true, new: true }
    );
    
    return {
        message,
        status
    };
};

module.exports = getAndSaveRandomLogMessage;
