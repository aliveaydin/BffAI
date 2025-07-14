const ApproveAgent = require('../models/ApproveAgent');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const getMicroservices = require('./getMicroservices');

const checkMicroService = async ({
    projectId,
    microServiceName,
    clientSockets,
    io
}) => {
    try {
        const microServices = JSON.parse(await getMicroservices({ projectId, clientSockets, io }));

        const microService = microServices.find(microService => microService.name === microServiceName);

        if (!microService){
            await Promise.all(clientSockets.map(socketId =>
                new Promise((resolve) => {
                    io.to(socketId).emit("error", "Microservice not found", resolve());
                })
            ));
            return BadRequestError("Microservice not found", 404, "Microservice not found");
        }

        const microServiceIndex = microServices.findIndex(microService => microService.name === microServiceName);
        const previousMicroService = microServiceIndex > 0 ? microServices[microServiceIndex - 1]: null;


        if(!previousMicroService) return {checkMicroServiceReady: true, microServiceId: microService.id};

        const previousMicroServiceData = await ApproveAgent.findOne({
            projectId,
            agent: "software-engineer",
            name: previousMicroService.name,
            isActive: true
        });

        if(!previousMicroServiceData) return {checkMicroServiceReady: BadRequestError("Previous microservice not found", 404, "Previous microservice not found")};
        if(!previousMicroServiceData.isApproved) return {checkMicroServiceReady: BadRequestError("Previous microservice not approved", 404, "Previous microservice not approved")};

        return {checkMicroServiceReady: true, microServiceId: microService.id};

    } catch (error) {
        console.error(error);
        throw HttpServerError(`error checking microservices ${error.message}`);
    }
};

module.exports = checkMicroService;