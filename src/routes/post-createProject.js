const express = require('express');
const router = express.Router();
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');


const checkUuid = require("../utils/checkUuId");

const sendPostFormData = require('../utils/sendPostFormData');
const sendRequest = require('../utils/sendRequest');
const aiUrl = process.env.AI_URL;
const checkUserAuthority = require('../db-utils/checkUserAuthority');

router.post('/project/:projectId', async (req, res, next) => {
    const { email,userId } = req.query;
    try {
        const { projectId } = req.params;
        const fullName = req.body.full_name;
        const shortName = req.body.short_name;
        const description = req.body.description;
        const organizationId = req.body.organizationId || userId;
        const token = req.query.token;

        if(!shortName) return next(BadRequestError("Short name is required", 422, "Short name is required"));
        if (!description) return next(BadRequestError("Description is required", 422, "Description is required"));
        if(!checkUuid(projectId)) return next(BadRequestError("Invalid project id", 422, "Invalid project id"));

        const projectUrl = process.env.MINDBRICKS_URL + "project/projects/" + projectId;

        const project = await sendRequest({ url: projectUrl, method: 'GET', token, projectId }); 
        if(project?.status != "OK") return next(NotFoundError("Project not found", 404, "Project not found"));

        const url = aiUrl + "/projects";

        const userPermissionOnProject = await checkUserAuthority({ email,userId, projectId, token });
  
        if (!userPermissionOnProject) return next(BadRequestError("User is not authorized to perform this action",404));
        const sendData = {
            organizationId: organizationId,
            shortname:shortName,
            fullname:fullName,
            description,
            project_id:projectId
        };

        const createProject = await sendPostFormData({
            url,
            method: 'POST',
            body: sendData,
            isFormData: true
        });

        if(createProject?.status != true){ 
            return next(HttpServerError("Error creating project", 500, "Error creating project"));
        }


        const sendDataToFrontend = {
            projetcCreated: true,
            projectId,
            shortName: shortName
        };

        return res.status(200).send(sendDataToFrontend);


    } catch (error) {
        return next(error);
    }
});

module.exports = router;
