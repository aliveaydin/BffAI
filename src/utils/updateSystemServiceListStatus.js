const SystemService = require("../models/SystemService");
const { client } = require("../../redis");

const updateSystemServiceListStatus = async ({
  io,
  projectId,
  serviceList,
  status,
  createdAt,
  name,
  userId,
  createdBy,
  updatedAt,
  serviceUrl,
  subDomain,
  isAiService,
  version,
  buildVersion,
  previewVersion,
  clientSockets

}) => {
  if (!clientSockets) clientSockets = await client.sMembers(`userSockets:${userId}`);
  const index = serviceList.findIndex(
    (service) => service.name?.toLowerCase() == name?.toLowerCase()
  );

  if (index == -1) {
    serviceList.push({
      name: name,
      status,
      serviceUrl,
      createdBy,
      subDomain,
      isAiService,
      version,
      createdAt,
      updatedAt,
      buildVersion,
      previewVersion,
    });
  } else {
    serviceList[index].serviceUrl = serviceUrl;
    serviceList[index].status = status;
    serviceList[index].subDomain = subDomain;
    serviceList[index].version = version;
    serviceList[index].buildVersion = buildVersion;
    serviceList[index].previewVersion = previewVersion;
    serviceList[index].createdBy = createdBy;
    serviceList[index].createdAt = createdAt;
    serviceList[index].updatedAt = updatedAt;
  }


  const newSystemService = await SystemService.findOneAndUpdate(
    { projectId: projectId },
    { $set: { serviceList } },
    { upsert: true, new: true }
  );


  if (io) {
    for (const socketId of clientSockets) {
      try {
        const socketData = JSON.parse(socketId);
        if (projectId == socketData.projectId) {
          io.to(socketData.socketId).emit(`system-service-logs:${name}`, JSON.stringify({
            serviceName: name,
            status
          }));
        }
      } catch (err) {
        console.log({error:err})
        console.log("Socket parse error:", err);
      }
    }
  }
}

module.exports = updateSystemServiceListStatus;  
