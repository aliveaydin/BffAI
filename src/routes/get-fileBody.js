const express = require('express');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const ApproveAgent = require('../models/ApproveAgent');

const checkAgentNames = require('../utils/checkAgentNames');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const router = express.Router();
router.post('/filebody/:projectId', async (req, res, next) => {
    const { email,userId } = req.query;
    try {
        const { projectId } = req.params;
        const token = req.query.token;

        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token , roleId:6});
        if (projectAndPermission != true) return next(projectAndPermission);

        const { agent, name } = req.body;
        if(!checkAgentNames(agent, name)) return next(BadRequestError("Agent or name is invalid", 422, "Agent or name is invalid"));

        const approvedList = await ApproveAgent.findOne({
            projectId, 
            agent, 
            name, 
            isActive: true
        },{ projectId: 1, agent: 1, name: 1, isApproved: 1, jsonBody: 1 }).lean();

        return res.status(200).send(approvedList);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;