const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");

const ApproveAgent = require("../models/ApproveAgent");
const checkProjectExist = require("../utils/checkProjectExist");
const sendPostFormData = require("../utils/sendPostFormData");
const aiUrl = process.env.AI_URL;
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const sendRequest = require("../utils/sendRequest");

const businessAnalyseUseCases = async ({ client, req, res, next, io, isAuto }) => {
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
      name: "Product Requirements Document",
      isApproved: true,
      isActive: true,
    });

    if (!isPrdApproved) return next(
        BadRequestError("prd is not approved", 404, "prd is not approved")
      );

    const sendData = {
      projectId,
      agent: "business-analyst",
      ProjectFileName: "Use Cases",
    };

    if(!isAuto){
      if(res){
        return res.status(200).send({
          ...sendData,
          message: "Check socket for logs",
        });
      }
    }

    const url = aiUrl + "/agents/business-analyst/create-use-cases";

    return await createProjectFile({
      url,
      io,
      contentType: "use_case",
      ...sendData,
      projectId,
      socketAgent: "business-analyst:use-cases",
      userId,
    });
  } catch (error) {
    console.log({
      error
    })
    if(!isAuto) return next(error);
  }
}

module.exports = businessAnalyseUseCases;