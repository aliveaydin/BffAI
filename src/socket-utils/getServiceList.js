const ServiceList = require("../models/ServiceList")
const fixServiceListSorting = require("../utils/fixServiceListSorting");
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getServiceList = async ({
    projectId,
    email,
    userId,
    token,
    io,
    socketId
}) => {
    try {
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission!=true) throw projectAndPermission;


        const services = (await ServiceList.findOne({
            projectId: projectId
        }))?.services || [];

        if (!services) throw new Error("No service list found");
        io.to(socketId).emit("service-list", fixServiceListSorting(services));

    } catch (error) {
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "getServiceListError"
        }));
    }
};

module.exports = getServiceList;