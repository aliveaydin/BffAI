const express = require('express');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');

const checkUuid = require("../utils/checkUuId");

const sendPostFormData = require('../utils/sendPostFormData');
const sendRequest = require('../utils/sendRequest');
const ApproveAgent = require('../models/ApproveAgent');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

module.exports = (io) => {
    const router = express.Router();
    router.post('/mdfile/:projectId', async (req, res, next) => {
        const { email,userId } = req.query;
        try {
            const { projectId } = req.params;
            const token = req.query.token;
            const { serviceName,agent } = req.body;

            const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token, roleId:6 });
            if (projectAndPermission != true) return next(projectAndPermission);

            const service = await ApproveAgent.findOne({ projectId, agent, name: serviceName, isActive: true});
            if (!service) return next(NotFoundError("Service not found", 404, "Service not found"));
            const serviceShortName = JSON.parse(service?.jsonBody)?.serviceSettings?.serviceBasics?.name;

            const sendBody = {
                serviceName:serviceShortName, 
                projectId, 
                docName:"rest-api-guide"
            };

            const createMdFile = await sendRequest({
                url: `${process.env.JOB_SERVICE_URL}buildservicedoc`,
                method: 'POST',
                body: { 
                    ...sendBody
                },
                bearerToken:token,
                projectId
            });

            const sendDataToFrontEnd = {
                mdFile:createMdFile
            }

            return res.status(200).send(sendDataToFrontEnd);
           
        } catch (error) {
            if(error.type === "axios"){
                const sendDataToFrontEnd = {
                    mdFile:"",
                }
                return res.status(200).send(sendDataToFrontEnd);
            }
            return next(error);
        }
    });
    return router;
}