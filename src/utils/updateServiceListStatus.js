const ServiceList = require("../models/ServiceList");
const sendMessageToUsersOnSocket = require("./sendMessageToUsersOnSocket");
const { client } = require("../../redis");
const Logs = require("../models/Logs");
const getAndSaveRandomLogMessage = require("./getAndSaveRandomLogMessage");

const updateServiceListStatus = async ({
  isMessageUpdate,
  io,
  projectId,
  serviceList,
  status,
  createdAt,
  name,
  createdBy,
  updatedAt,
  serviceUrl,
  subDomain,
  isAiService,
  version,
  buildVersion,
  previewVersion

}) => {
  if (!Array.isArray(serviceList)) {
    serviceList = [];
  }
  
  const language = process.env.LANGUAGE || "tr";
  const index = serviceList.findIndex(
    (service) => service.name?.toLowerCase() == name?.toLowerCase()
  );

  if (index == -1) {
    serviceList.push({
      name: name,
      status: status,
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
    const service = serviceList[index];

    service.serviceUrl = serviceUrl ?? service.serviceUrl;
    service.status = status ?? service.status;
    service.subDomain = subDomain ?? service.subDomain;
    service.version = version ?? service.version;
    service.buildVersion = buildVersion ?? service.buildVersion;
    service.previewVersion = previewVersion ?? service.previewVersion;
    service.createdBy = createdBy ?? service.createdBy;
    service.createdAt = createdAt ?? service.createdAt;
    service.updatedAt = updatedAt ?? service.updatedAt;
    
  }

  if (isMessageUpdate) {
    let newStatus, agent = "system";
    if( status == "building") newStatus = "repo-start";
    if (status == "built") newStatus = "repo-end";
    if( status == "starting") newStatus = "preview-start";
    if (status == "started") newStatus = "preview-end";

    let message = {
      eventName: "system",
      agent,
      name,
      type: ""
    };
    
    await getAndSaveRandomLogMessage({
      projectId,
      language,
      agent,
      status: newStatus,
      extraMessage: message
    });

  }

  await ServiceList.findOneAndUpdate(
    { projectId },
    { $set: { serviceList } },
    { upsert: true, new: true }
  );
  if (io) {
    await sendMessageToUsersOnSocket({
      isMessageUpdate,
      projectId,
      serviceList,
      io,
      client
    })
  }
}

module.exports = updateServiceListStatus;  
