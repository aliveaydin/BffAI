const ServiceList = require('../models/ServiceList');
const { client } = require("../../redis");
const getElastic = require("../elastic-utils/getElastic");
const fixServiceListSorting = require("../utils/fixServiceListSorting");

const serviceStateDeletedController = async (topic, partition, message, io) => {
    try {
        const data = JSON.parse(message);
        const projectId = data.projectId;
        const serviceName = data.serviceName;

        const bffAiServices = (await ServiceList.findOne({
            projectId
        }));

        let serviceList = bffAiServices?.serviceList || [];

        if (!bffAiServices) return;
        const isExistServiceInArray = serviceList.some(service => service.name?.toLowerCase() == serviceName?.toLowerCase());
        if (!isExistServiceInArray) return;

        const index = serviceList.findIndex(service => service.name?.toLowerCase() == serviceName?.toLowerCase());

        serviceList.splice(index, 1);


        await ServiceList.updateOne(
            { projectId },
            { $set: { serviceList } }
        );


        const projectMembers = await getElastic("mindbricks_projectmember", projectId, { byField: "projectId" });
        const userIdList = projectMembers.map(member => member.userId);


        for (const userId of userIdList) {
            try {
                let clientSockets = await client.sMembers(`userSockets:${userId}`);

                for (const socketId of clientSockets) {
                    try {
                        const socketData = JSON.parse(socketId);
                        if (projectId == socketData.projectId) {
                            io.to(socketData.socketId).emit('service-list', fixServiceListSorting(serviceList));
                        }
                    } catch (err) {
                        console.log("Socket parse error:", err);
                    }
                }
            } catch (err) {
                console.log("Socket parse error:", err);
            }
        }


        return;

    } catch (error) {
        console.log(error);
    }
};

module.exports = serviceStateDeletedController;
