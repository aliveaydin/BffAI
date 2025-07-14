const ApproveAgent = require('../models/ApproveAgent');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');

const getMicroservices = async ({
    projectId,
    clientSockets,
    io
}) => {
    try {
        const microServices = await ApproveAgent.findOne({
            projectId, agent: "software-architect",
            name: "micro-services",
            isActive: true
        });

        if (!microServices) {
            for (const socketId of clientSockets) {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketId).emit("error", "Microservices not found");
                }
            }

            return NotFoundError("Microservices not found", 404, "Microservices not found");
        }

        if (!microServices.isApproved) {
            for (const socketId of clientSockets) {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit("error", "Microservices are not approved");
                }
            }

            return BadRequestError("Microservices are not approved", 404, "Microservices are not approved");
        }

        return microServices.jsonBody;
    } catch (error) {
        console.error(error);
        throw HttpServerError(`error getting microservices ${error.message}`);
    }
};

module.exports = getMicroservices;