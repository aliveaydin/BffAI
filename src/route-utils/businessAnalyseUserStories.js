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

const businessAnalyseUserStories = async ({client,req,res,next,io,isAuto}) => {
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

        const isReportApproved = await ApproveAgent.findOne({
          projectId,
          agent: "project-manager",
          name: "Project Description And Scope",
          isApproved: true,
          isActive: true,
        });
        if (!isReportApproved)
          return next(
            BadRequestError(
              "Project manager report is not approved",
              404,
              "Project manager report is not approved"
            )
          );

        const sendData = {
          projectId,
          agent: "project-manager",
          ProjectFileName: "User Stories",
        };

        if(!isAuto){
          if(res){
            return res.status(200).send({
              ...sendData,
              message: "Check socket for logs",
            });
          }
        }

        const url = aiUrl + "/agents/product-manager/create-user-stories";

        return await createProjectFile({
          url,
          io,
          contentType: "user_story",
          projectId,
          ...sendData,
          socketAgent: "project-manager:user-stories",
          userId,
        });
      } catch (error) {
        console.log({
          error
        })
        if(isAuto) return next(error);
      }
}

module.exports = businessAnalyseUserStories;