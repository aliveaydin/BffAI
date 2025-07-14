const ServiceList = require('../models/ServiceList');
const { client } = require("../../redis");
const getElastic = require("../elastic-utils/getElastic");
const fixServiceListSorting = require("../utils/fixServiceListSorting");

const deployedStatusController = async (topic, partition, message, io) => {
  try {
    const data = JSON.parse(message);

    const projectId = data.projectId;
    const serviceName = data.serviceName;
    const status = data.status;
    const version = data.version;
    const date = data.date;

    const bffAiServices = (await ServiceList.findOne({
      projectId
    }));

    const serviceList = bffAiServices?.serviceList || [];
    const index = serviceList.findIndex(service => service.name?.toLowerCase() == serviceName?.toLowerCase());

    if (index == -1) return true;

      // let updatedStatus;

      // if (status == "pending" || status == "created") {
      //   updatedStatus = "3"; // pending status
      // } else if (status == "deploying") {
      //   updatedStatus = "4"; // deploying status
      // } else if(status == "deployed") {
      //   updatedStatus = "5"; // deployed status
      // }else{
      //   updatedStatus = "-1"; // unknown status
      // }

    // update serviceList
    serviceList[index] = {
      ...serviceList[index],
      status,
    }

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

module.exports = deployedStatusController;