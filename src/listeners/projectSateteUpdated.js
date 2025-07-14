const SystemService = require("../models/SystemService");
const { client } = require("../../redis");
const getElastic = require("../elastic-utils/getElastic");
const fixServiceListSorting = require("../utils/fixServiceListSorting");

const projectSateteUpdatedController = async (topic, partition, message, io) => {
    try {
        const data = JSON.parse(message);
        const projectId = data.projectId;
        const version = data.version;


        const bffAiServices = await SystemService.findOne({
            projectId,
        });
        
        const now = new Date();
        const createdAt = now;
        const updatedAt = now;
    
        const buildVersion = null;
        const previewVersion = null;

        let serviceList = bffAiServices?.serviceList || [
            {
                name: "panel",
                subDomain:null,
                isAiService:false,
                version,
                status: "started",
                createdAt,
                updatedAt,
                buildVersion,
                previewVersion,
            },
            {
                name: "document",
                subDomain:null,
                isAiService:false,
                version,
                status: "started",
                createdAt,
                updatedAt,
                buildVersion,
                previewVersion,
            }
        ];
        serviceList = serviceList.map((service) => {
            return {
                ...service,
                version: version,
            };
        });

        await SystemService.findOneAndUpdate(
            { projectId },
            { serviceList },
            { upsert: true, new: true }
        );


    const projectMembers = await getElastic("mindbricks_projectmember", projectId, { byField: "projectId" });
    const userIdList = [...new Set(projectMembers.map(member => member.userId))];

    for (const userId of userIdList) {
      try {
        let clientSocketsRaw = await client.sMembers(`userSockets:${userId}`);
        let clientSockets = [...new Set(clientSocketsRaw)];


        for (const socketId of clientSockets) {
          try {
            const socketData = JSON.parse(socketId);
            if (projectId == socketData.projectId) {
              io.to(socketData.socketId).emit('system-service-list', fixServiceListSorting(serviceList));
              io.to(socketData.socketId).emit('project-version', version);
            }
          } catch (err) {
            console.log("Socket parse error:", err);
          }
        }
      } catch (err) {
        console.log("Socket parse error:", err);
      }
    }

    } catch (error) {
        console.log(error);
    }
};

module.exports = projectSateteUpdatedController;
