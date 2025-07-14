const sendRequest = require("../utils/sendRequest");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getChatHistory = async ({
    projectId,
    email,
    userId,
    token,
    io,
    agent,
    socketId
}) => {
    try {
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission!=true) throw projectAndPermission;

        const aiUrl = process.env.AI_URL;
        let getChatMessages = "";

        if(agent=="project-manager"){
            const url = aiUrl + "/agents/product-manager/chat";
            getChatMessages = (await sendRequest({
                url,
                method: "GET",
                body: { project_id: projectId },
                isFormData: true,
                projectId
              }))?.data || [];
        }

        io.to(socketId).emit("message-history", dataFormatBeautify(getChatMessages));
    } catch (error) {
        console.log("message-history")
        console.log(error)
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "message-history"
        }));
    }
}

function dataFormatBeautify(data) {
    try {
        const respponse = [];
        data.forEach((item) => {
            if(item.role=="assistant"){
                respponse.push({
                    "ai":item.content
                })
            }
            if(item.role=="user"){
                respponse.push({
                    "user":item.content
                })
            }
        });
        return respponse;
    } catch (error) {
        return false;
    }
}

module.exports = getChatHistory;