const express = require("express");
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");
const { client } = require("../../redis");

const aiUrl = process.env.AI_URL;
const ApproveAgent = require("../models/ApproveAgent");
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");

module.exports = (io) => {
  const router = express.Router();
  router.post("/createprd/:projectId", async (req, res, next) => {
    const { email,userId } = req.query;
    try {
      const token = req.query.token;

      const { projectId } = req.params;

      const projectAndPermission = await checkProjectAndPermission({
        projectId,
        email,
        userId,
        token,
      });
      if (projectAndPermission != true) return next(projectAndPermission);

      const isUserStoriesApproved = await ApproveAgent.findOne({
        projectId,
        agent: "project-manager",
        name: "User Stories",
        isApproved: true,
        isActive: true,
      });
      if (!isUserStoriesApproved)
        return next(
          BadRequestError(
            "User stories are not approved",
            404,
            "User stories are not approved"
          )
        );
      //here appove user stories
      const sendData = {
        projectId,
        agent: "project-manager",
        ProjectFileName: "Product Requirements Document",
      };

      res.status(200).send({
        ...sendData,
        message: "Check socket for logs",
      });

      const url = aiUrl + "/agents/product-manager/create-prd";

      return await createProjectFile({
        url,
        io,
        contentType: "markdown",
        projectId,
        ...sendData,
        socketAgent: "project-manager:prd",
        userId,
      });
    } catch (error) {
      return next(error);
    }
  });
  return router;
};
