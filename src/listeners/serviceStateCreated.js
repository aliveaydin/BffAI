const { handleServiceCreation } = require("./serviceStateHelpers");

const serviceStateCreatedController = async (topic, partition, message, io) => {
  try {
    const data = JSON.parse(message);
    const projectId = data.projectId;
    const serviceName = data.serviceName;
    const serviceUrl = data.serviceUrl;
    const version = "1.0.0";
    const createdBy = data.createdBy;
    const token = data.token;

    await handleServiceCreation(io, projectId, serviceName, serviceUrl, version, createdBy, token);
    
  } catch (error) {
    console.log(error);
  }
};

module.exports = serviceStateCreatedController;
