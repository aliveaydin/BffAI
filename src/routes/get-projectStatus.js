const express = require('express');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');

const checkUuid = require("../utils/checkUuId");

const sendPostFormData = require('../utils/sendPostFormData');
const sendRequest = require('../utils/sendRequest');
const aiUrl = process.env.AI_URL;
const checkUserAuthority = require('../db-utils/checkUserAuthority');

module.exports = (io) => {
    const router = express.Router();
    router.get('/getprojectstatus/:projectId', async (req, res, next) => {
        const { email,userId } = req.query;
        try {
            const { projectId } = req.params;
            const token = req.query.token;
            if (!checkUuid(projectId)) return next(BadRequestError("Invalid project id", 422, "Invalid project id"));

            const projectUrl = process.env.MINDBRICKS_URL + "project/projects/" + projectId;
            const project = await sendRequest({ url: projectUrl, method: 'GET', token, projectId });

            if (project?.status != "OK") return next(NotFoundError("Project not found", 404, "Project not found"));

            const url = aiUrl + "/projects/"+projectId+"/status";
            const userPermissionOnProject = await checkUserAuthority({ email,userId, projectId, token, roleId:6 });
            if (!userPermissionOnProject) return next(BadRequestError("User is not authorized to perform this action",404));

            let getChatMessages = await sendRequest({
                url,
                method: 'GET',
                body: { project_id: projectId },
                isFormData: true
            });
 
            let sendDataToFrontend = {
                projectId: projectId,
                data: getChatMessages.data
            };

            return res.status(200).send(sendDataToFrontend);
        } catch (error) {
            return next(error);
        }
    });
    return router;
}