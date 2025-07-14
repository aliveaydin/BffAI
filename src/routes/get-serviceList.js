const express = require('express');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const ApproveAgent = require('../models/ApproveAgent');

const checkAgentNames = require('../utils/checkAgentNames');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');
const sendRequest = require('../utils/sendRequest');
const getServiceList = require('../utils/getServiceList');
const { client } = require("../../redis");
const fixServiceListSorting = require('../utils/fixServiceListSorting');

module.exports = (io) => {
    const router = express.Router();
    router.get('/serviceList/:projectId', async (req, res, next) => {
        const { email, userId } = req.query;
        try {
            const { projectId } = req.params;
            const token = req.query.token;

            const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token, roleId: 6 });
            if (projectAndPermission != true) return next(projectAndPermission);

            const serviceList = (await getServiceList({
                projectId,
                token
            }))

            let clientSockets = await client.sMembers(`userSockets:${userId}`);

            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('service-list', fixServiceListSorting(serviceList));
                    }
                } catch (err) {
                    console.log("Socket parse error:", err);
                }
            }
            return res.status(200).json({
                success: true,
                data: serviceList
            });
        } catch (error) {
            return next(error);
        }
    });
    return router;
}