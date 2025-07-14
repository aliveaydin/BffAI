const serviceStateCreatedQue = process.env.SERVICE_STATE_CREATED;
const serviceStateUpdatedQue = process.env.SERVICE_STATE_UPDATED;
const projectSateteUpdatedQue = process.env.PROJECT_UPDATED_TOPIC;
const deployedStatusQue = process.env.SERVICE_DEPLOYED_STATUS;

module.exports = {
    serviceStateCreatedQue,
    serviceStateUpdatedQue,
    deployedStatusQue,
    projectSateteUpdatedQue
}