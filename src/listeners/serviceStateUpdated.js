const ServiceList = require("../models/ServiceList");
const { client } = require("../../redis");
const getElastic = require("../elastic-utils/getElastic");
const fixServiceListSorting = require("../utils/fixServiceListSorting");
const Gitlab = require("../models/Gitlab");
const { sendMessage } = require("../utils/kafka");
const sendRequest = require("../utils/sendRequest");
const { createGitlabRepo, startPreview } = require("./serviceStateHelpers");

const serviceStateUpdatedController = async (topic, partition, message, io) => {
  try {
    const data = JSON.parse(message);

    const projectId = data.projectId;
    const oldName = data.oldName || data.serviceName;
    const newName = data.newName || data.serviceName;
    const newUrl = data.newUrl || null;
    const version = data.version;
    const userType = data?.updatedBy?.type || data?.createdBy?.type;
    const token = data.token;
    const updatedBy = data.updatedBy;
    const updatedAt = new Date();
    let serviceUrl;
 
    let status = null,
      repoUrl,
      webUrl,
      groupId,
      repoVersion
      ;

    let isSpecialService = false;
    if (
      (newName == "bff" || newName == "auth" || newName == "notification") &&
      userType == "agent"
    )
      isSpecialService = true;


      const services = await ServiceList.findOne({
        projectId,
      });
  
      if (!services) return;
  
      const serviceList = services.serviceList;
  
      serviceList.forEach((service) => {
        const oldService = { ...service }
        if(service.name?.toLowerCase() == oldName?.toLowerCase()){
          repoVersion = oldService.repoVersion || "1.0.0";
        }
      });

    if (isSpecialService) {
      let gitlabId, repo;
      status = "building";
      try {
        repo = await createGitlabRepo(newName, projectId, token);
        status = "built";
        gitlabId = repo?.gitlabProject?.id;

        await Gitlab.create({
          projectId,
          name: oldName,
          gitlabId,
          repoUrl: repo?.gitlabProject?.web_url,
          webUrl: repo?.gitlabProject?.web_url,
          groupId: repo?.gitlabProject?.group_id
        });

        const preview = await startPreview(newName, projectId, gitlabId, token);
        status = "started";
        subDomain = preview?.subdomain;
      } catch (error) {
        console.log(error);
      }
    }

    
    const newServiceList = serviceList.map((service) => {
      const oldService = { ...service }
      serviceUrl = newUrl ? newUrl : oldService.serviceUrl;
      if(service.name?.toLowerCase() == oldName?.toLowerCase()){
        repoVersion = oldService.repoVersion || "1.0.0";
        return {
          ...oldService,
          name: newName,
          serviceUrl,
          status: status ? status : service.status,
          version,
          createdBy: service.createdBy,
          buildVersion: isSpecialService ? version : service.buildVersion,
          previewVersion: isSpecialService ? version : service.previewVersion,
          updatedBy,
          updatedAt,
        }
      }
      return oldService;
    });

    await Gitlab.updateOne(
      { projectId, name: oldName },
      { $set: { serviceUrl } },
      { upsert: true }
    );

    await ServiceList.updateOne(
      { projectId },
      { $set: { serviceList: newServiceList } }
    );

    const projectMembers = await getElastic(
      "mindbricks_projectmember",
      projectId,
      { byField: "projectId" }
    );
    const userIdList = [
      ...new Set(projectMembers.map((member) => member.userId)),
    ];

    for (const userId of userIdList) {
      try {
        let clientSocketsRaw = await client.sMembers(`userSockets:${userId}`);
        let clientSockets = [...new Set(clientSocketsRaw)];

        for (const socketId of clientSockets) {
          try {
            const socketData = JSON.parse(socketId);
            if (projectId == socketData.projectId) {
              io.to(socketData.socketId).emit(
                "service-list",
                fixServiceListSorting(newServiceList)
              );
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

module.exports = serviceStateUpdatedController;
