const express = require("express");
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");
const { client } = require("../../redis");

const ApproveAgent = require("../models/ApproveAgent");
const checkProjectExist = require("../utils/checkProjectExist");
const sendPostFormData = require("../utils/sendPostFormData");
const aiUrl = process.env.AI_URL;
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const sendRequest = require("../utils/sendRequest");
const tryFailedServices = require("../utils/tryFailedServices");
const getAndSaveRandomLogMessage = require("../utils/getAndSaveRandomLogMessage");
const getLastLog = require("../socket-utils/getChatLastLog");

module.exports = (io) => {
  const router = express.Router();
  router.post("/projectmanager/:projectId", async (req, res, next) => {
    const { email, userId } = req.query;
    const prompt = req.body?.prompt;
    const isAuto = req.body?.isAuto;
    try {
      const language = process.env.LANGUAGE || "tr";
      const token = req.query.token;
      const { projectId } = req.params;
      let clientSockets = await client.sMembers(`userSockets:${userId}`);

      const projectAndPermission = await checkProjectAndPermission({
        projectId,
        email,
        userId,
        token,
      });


      if (projectAndPermission != true) return next(projectAndPermission);

      const isReportCreated = await ApproveAgent.findOne({
        projectId,
        agent: "project-manager",
        name: "Project Description And Scope",
        isActive: true,
      });

      if (isReportCreated)
        return next(
          BadRequestError(
            "Project manager report is already created",
            404,
            "Project manager report is already created"
          )
        );

      if (!(await checkProjectExist(projectId)))
        return next(
          NotFoundError("Project not created", 404, "Project not created")
        );


      if (typeof prompt != "string")
        return next(
          BadRequestError("Prompt is required", 422, "Prompt is required")
        );

      const productManagerUrl = aiUrl + "/agents/product-manager/chat";

      const sendProductManagerData = {
        prompt,
        project_id: projectId,
      };

      const createProjectManager = await sendPostFormData({
        url: productManagerUrl,
        method: "POST",
        body: sendProductManagerData,
        isFormData: true,
      });

      if (createProjectManager?.status != true) {
        return next(
          HttpServerError(
            createProjectManager?.message,
            500,
            "Error creating project"
          )
        );
      }
      let sendDataToFrontend = {
        isDone: createProjectManager.data.is_done,
        chat: createProjectManager.data.message,
      };

      const isDone = createProjectManager.data.is_done;
      if (isDone) {

        const sendData = {
          projectId,
          agent: "project-manager",
          ProjectFileName: "Project Description And Scope",
        };

        res.status(200).send({
          projectManager: createProjectManager,
          ...sendData,
          message: "Check socket for logs",
        });

        const url = aiUrl + "/agents/product-manager/create-report";

        await createProjectFile({
          url,
          io,
          contentType: "markdown",
          projectId,
          ...sendData,
          socketAgent: "project-manager:report",
          userId,
        });


        if (isAuto) {

          const autoApprove = require("../utils/autoApprove");

          await autoApprove({
            projectId,
            "agent": "project-manager",
            "ProjectFileName": "Project Description And Scope",
            io,
            userId,
            client
          });


          const businessAnalyseUserStories = require("../route-utils/businessAnalyseUserStories");
          await businessAnalyseUserStories(
            {
              client,
              req,
              res,
              next,
              io,
              isAuto
            }
          );


          await autoApprove({
            projectId,
            "agent": "project-manager",
            "ProjectFileName": "User Stories",
            io,
            userId,
            client
          });


          const projectMangerPrd = require("../route-utils/projectMangerPrd");

          await projectMangerPrd(
            {
              client,
              req,
              res,
              next,
              io,
              isAuto
            }
          );


          await autoApprove({
            projectId,
            "agent": "project-manager",
            "ProjectFileName": "Product Requirements Document",
            io,
            userId,
            client
          });

          const businessAnalyseUseCases = require("../route-utils/businessAnalyseUseCases");
          await businessAnalyseUseCases(
            {
              client,
              req,
              res,
              next,
              io,
              isAuto
            }
          );


          await autoApprove({
            projectId,
            "agent": "business-analyst",
            "ProjectFileName": "Use Cases",
            io,
            userId,
            client
          });

          const softwareArchitect = require("../route-utils/softwareArchitect");

          const services = await softwareArchitect(
            {
              client,
              req,
              res,
              next,
              io,
              isAuto
            }
          );

          let success;
          for (const [index, service] of services.entries()) {
            if (index != 0) {
              await autoApprove({
                projectId,
                "agent": "software-engineer",
                "ProjectFileName": services[index - 1].name,
                success,
                io,
                userId,
                client
              });
            }
            const softwareEngineer = require("../route-utils/softwareEngineer");

            try {
              success = await softwareEngineer(
                {
                  client,
                  req,
                  res,
                  next,
                  io,
                  isAuto,
                  microServiceName: service.name
                }
              );
            } catch (error) {
              const approveAgentJson = {
                projectId,
                agent: "software-engineer",
                name: service.name
              }
              const approveAgent = new ApproveAgent({
                ...approveAgentJson,
                jsonBody: "",
                contentType: "designed_micro_service",
                isApproved: false
              });
              await approveAgent.save();

              console.log(error);
            }
          }

          await tryFailedServices({
            client,
            req,
            res,
            next,
            io
          });

        }
        const message = {
          eventName: "",
          agent: "",
          name: "",
          type: "finished"
        };
        const randomMessage = await getAndSaveRandomLogMessage({
          projectId,
          language,
          agent: socketAgent,
          status: "end",
          extraMessage: message
        });
        
        for (const socketId of clientSockets) {
          try {
            const socketData = JSON.parse(socketId);
            if (projectId == socketData.projectId) {
              io.to(socketData.socketId).emit('log', JSON.stringify({
                ...message,
                message: randomMessage.message,
                status: randomMessage.status
              }));
              await getLastLog({
                io,
                socketId: socketData.socketId,
                projectId,
              })
            }
          } catch (err) {
            console.log("Socket parse error:", err);
          }
        }
        return;
      }


      return res.status(200).send({
        projectManager: createProjectManager,
        ...sendDataToFrontend,
        message: "Check socket for logs",
      });
    } catch (error) {
      console.log(error);
      if (!isAuto) return next(error);
    }
  });
  return router;
};
