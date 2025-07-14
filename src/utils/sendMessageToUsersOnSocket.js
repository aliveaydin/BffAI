const ServiceList = require("../models/ServiceList");
const { client } = require("../../redis");
const getElastic = require("../elastic-utils/getElastic");
const fixServiceListSorting = require("../utils/fixServiceListSorting");
const getLastLog = require("../socket-utils/getChatLastLog");

const sendMessageToUsersOnSocket = async ({
    isMessageUpdate = false,
    projectId,
    serviceList,
    io,
    client
}) => {
    const projectMembers = await getElastic(
        "mindbricks_projectmember",
        projectId,
        { byField: "projectId" }
    );

    const userIdList = projectMembers.map((member) => member.userId);


    for (const userId of userIdList) {
        try {
            let clientSockets = await client.sMembers(`userSockets:${userId}`);
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        if(isMessageUpdate){
                            await getLastLog({
                                io,
                                socketId: socketData.socketId,
                                projectId,
                            })
                        }
                        io.to(socketData.socketId).emit("service-list", fixServiceListSorting(serviceList));
                    }
                } catch (err) {
                    console.log("Socket parse error:", err);
                }
            }
        } catch (err) {
            console.log("Socket parse error:", err);
        }
    }
}

module.exports = sendMessageToUsersOnSocket;