const serviceStateCreatedController = require("./serviceStateCreated");
const serviceStateUpdatedController = require("./serviceStateUpdated");
const projectSateteUpdatedController = require("./projectSateteUpdated");
const deployedStatusController = require("./deployedStatus");

const listen = require("../utils/listener");
const topics = require("./topics");

const topicsControllers = {
    [topics.serviceStateCreatedQue]:serviceStateCreatedController,
    [topics.serviceStateUpdatedQue]:serviceStateUpdatedController,
    [topics.projectSateteUpdatedQue]:projectSateteUpdatedController,
    // [topics.deployedStatusQue]:deployedStatusController
}

module.exports = async (io)=>{
    try {
        console.log("Listening to topics");
        await listen(topicsControllers,io);

    } catch (error) {
        console.log(error);
    }
};