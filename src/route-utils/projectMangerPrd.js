const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");

const { producer } = require('../utils/kafka');
const ApproveAgent = require("../models/ApproveAgent");
const checkProjectExist = require("../utils/checkProjectExist");
const sendPostFormData = require("../utils/sendPostFormData");
const aiUrl = process.env.AI_URL;
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const sendRequest = require("../utils/sendRequest");

const projectMangerPrd = async ({ client, req, res, next, io, isAuto }) => {
  const { email, userId } = req.query;
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

    const isPrdApproved = await ApproveAgent.findOne({
      projectId,
      agent: "project-manager",
      name: "User Stories",
      isApproved: true,
      isActive: true,
    });

    if (!isPrdApproved) return next(
      BadRequestError("user-stories is not approved", 404, "user-stories is not approved")
    );

    const sendData = {
      projectId,
      agent: "project-manager",
      ProjectFileName: "Product Requirements Document",
    };

    if (!isAuto) {
      if(res){
        return res.status(200).send({
          ...sendData,
          message: "Check socket for logs",
        });
      }
    }

    const url = aiUrl + "/agents/product-manager/create-prd";

    const prd = await createProjectFile({
      url,
      io,
      contentType: "markdown",
      projectId,
      ...sendData,
      socketAgent: "project-manager:prd",
      userId,
    });

    producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [
        { value: JSON.stringify({ token, projectId, docType: "prd", "name": "Product Requirements Document", content:prd }) },
      ],
    });

    return prd;

  } catch (error) {
    console.log({
      error
    })
    if (!isAuto) return next(error);
  }
}

module.exports = projectMangerPrd;