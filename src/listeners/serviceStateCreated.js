const ServiceList = require("../models/ServiceList");
const { client } = require("../../redis");
const sendRequest = require("../utils/sendRequest");
const Gitlab = require("../models/Gitlab");
const { sendMessage } = require("../utils/kafka");
const sendMessageToUsersOnSocket = require("../utils/sendMessageToUsersOnSocket");
const updateServiceListStatus = require("../utils/updateServiceListStatus");

const serviceStateCreatedController = async (topic, partition, message, io) => {
  try {
    const data = JSON.parse(message);
    const projectId = data.projectId;
    const serviceName = data.serviceName;
    const serviceUrl = data.serviceUrl;
    const version = "1.0.0";
    const userType = data?.updatedBy?.type || data?.createdBy?.type;
    let buildVersion = null;
    let previewVersion = null;
    const createdBy = data.createdBy;
    const token = data.token;

    const now = new Date();

    const createdAt = now;
    const updatedAt = now;

    let gitlabId, repo, subDomain, repoUrl, webUrl, groupId, status;
    let bffAiServices = await ServiceList.findOne({
      projectId,
    });
    let isSpecialService = false;
    if((serviceName=="bff" || serviceName=="auth" || serviceName=="notification")&&userType=="agent") isSpecialService = true;

    
    let serviceList = bffAiServices?.serviceList || [];
    try {
      status = "building";
      await updateServiceListStatus({
        io,
        projectId,
        serviceList,
        status,
        isMessageUpdate:!isSpecialService,
        createdAt,
        updatedAt,
        name: serviceName,
        serviceUrl,
        createdBy,
        subDomain,
        isAiService: false,
        version,
        buildVersion: "1.0.0",
        previewVersion: "1.0.0",
      });

      repo = await sendRequest({
        url: `${process.env.JOB_SERVICE_URL}api/genesis/getrepo`,
        method: "POST",
        body: { serviceName: serviceName, projectId, repoVersion:"1.0.0" },
        token,
      });
      if (repo) {
        sendMessage("mindbricks-bff-service-preview-gitlab-project", {
          data,
          repo,
        });
      }

      buildVersion = "1.0.0";

      status = "built";
      await updateServiceListStatus({
        io,
        projectId,
        serviceList,
        status,
        isMessageUpdate:!isSpecialService,
        createdAt,
        updatedAt,
        name: serviceName,
        serviceUrl,
        createdBy,
        subDomain,
        isAiService: false,
        version,
        buildVersion: "1.0.0",
        previewVersion: "1.0.0",
      });

      gitlabId = repo?.gitlabProject?.id;
      repoUrl = repo?.gitlabProject?.repoUrl;
      webUrl = repo?.gitlabProject?.webUrl;
      groupId = repo?.gitlabProject?.groupId;
      await Gitlab.findOneAndUpdate(
        { projectId, name: serviceName },
        { $set: { gitlabId, serviceUrl, repoUrl, webUrl, groupId } },
        { upsert: true, new: true }
      );

      status = "starting";
      await updateServiceListStatus({
        io,
        projectId,
        serviceList,
        status,
        isMessageUpdate:!isSpecialService,
        createdAt,
        updatedAt,
        name: serviceName,
        createdBy,
        serviceUrl,
        subDomain,
        isAiService: false,
        version,
        buildVersion: "1.0.0",
        previewVersion: "1.0.0",
      });

      const preview = await sendRequest({
        url: `${process.env.JOB_SERVICE_URL}api/genesis/startpreview`,
        method: "POST",
        body: { serviceName: serviceName, projectId, gitlabId },
        token,
      });
      previewVersion = "1.0.0";
      subDomain = preview?.subdomain;

      console.log({
        preivew:{
          serviceName: serviceName, projectId, type:"created", gitlabId
        }
      })
      status = "started";
      await updateServiceListStatus({
        io,
        projectId,
        serviceList,
        status,
        isMessageUpdate:!isSpecialService,
        createdAt,
        updatedAt,
        name: serviceName,
        serviceUrl,
        createdBy,
        subDomain,
        isAiService: false,
        version,
        buildVersion: "1.0.0",
        previewVersion: "1.0.0",
      });
    } catch (error) {
      console.log(error);
    }

    bffAiServices = await ServiceList.findOne({
      projectId,
    });

    serviceList = bffAiServices?.serviceList || [];

    if (!bffAiServices) {
      serviceList = [
        {
          name: serviceName,
          serviceName,
          serviceUrl,
          subDomain,
          status: "started",
          version,
          buildVersion,
          previewVersion,
          createdBy,
        },
      ];

      const bffAiServicesJson = {
        projectId,
        serviceList,
      };

      await ServiceList.findOneAndUpdate({ projectId }, bffAiServicesJson, {
        upsert: true,
        new: true,
      });

      sendMessageToUsersOnSocket({
        projectId,
        serviceList,
        io,
        client,
      });
    } else {
      if(!status){
        await updateServiceListStatus({
          io,
          projectId,
          serviceList,
          status: "started",
          isMessageUpdate:!isSpecialService,
          createdAt,
          updatedAt,
          name: serviceName,
          serviceUrl,
          createdBy,
          subDomain,
          isAiService: false,
          version,
          buildVersion: "1.0.0",
          previewVersion: "1.0.0",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = serviceStateCreatedController;
