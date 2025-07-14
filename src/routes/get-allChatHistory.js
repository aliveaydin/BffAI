const express = require("express");
const router = express.Router();
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");
const { client } = require("../../redis");
const ApproveAgent = require("../models/ApproveAgent")
const { producer } = require('../utils/kafka');

const sendPostFormData = require("../utils/sendPostFormData");
const sendRequest = require("../utils/sendRequest");
const aiUrl = process.env.AI_URL
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const createProjectFile = require("../db-utils/createProjectFile");

module.exports = (io) => {
  const router = express.Router();
  router.get("/getprojects/:projectId", async (req, res, next) => {
    const { email, userId } = req.query;
    try {
      const { projectId } = req.params;
      const token = req.query.token;
      const projectAndPermission = await checkProjectAndPermission({
        projectId,
        email,
        userId,
        token,
      });

      if (projectAndPermission != true) return next(projectAndPermission);

      const url = aiUrl + "/agents/product-manager/chat";
      const urlStatus = aiUrl + "/projects/" + projectId + "/status";

      let getChatMessages = await sendRequest({
        url,
        method: "GET",
        body: { project_id: projectId },
        isFormData: true,
        projectId
      });

      let createProjectManager;

      if (
        !getChatMessages.data ||
        (Array.isArray(getChatMessages.data) && getChatMessages.data.length == 0)
      ) {
        const productManagerUrl = aiUrl + "/agents/product-manager/chat";

        const sendProductManagerData = {
          prompt: "",
          project_id: projectId,
        };

        createProjectManager = await sendPostFormData({
          url: productManagerUrl,
          method: "POST",
          body: sendProductManagerData,
          isFormData: true,
        });

        if (createProjectManager?.status != true) {
          return next(
            HttpServerError(
              "Error creating project manager",
              500,
              "Error creating project manager"
            )
          );

        }
      }

      let getChatStatus = await sendRequest({
        url: urlStatus,
        method: "GET",
        body: { project_id: projectId },
        isFormData: true,
        projectId
      });

      let isChatDone = true;
      if (getChatStatus?.data?.initial_chat_completed == false) isChatDone = false;
      if (
        !getChatMessages.data ||
        (Array.isArray(getChatMessages.data) && getChatMessages.data.length == 0)
      ) {
        if (isChatDone) {
          const isDone = createProjectManager.data.is_done;
          if (isDone) {
            const sendData = {
              projectId,
              agent: "project-manager",
              ProjectFileName: "Project Description And Scope",
              data: [{ role: "assistant", content: createProjectManager.data?.message || "Details are enough to proceed" }]
            };

            const url = aiUrl + "/agents/product-manager/create-report";

            res.status(200).send({
              projectManager: createProjectManager,
              ...sendData,
              message: "Check socket for logs",
            });
            try {
              await createProjectFile({
                url,
                io,
                contentType: "markdown",
                projectId,
                ...sendData,
                socketAgent: "project-manager:report",
                userId,
              });

              const coreProjectConfiguration = await sendPostFormData({
                url: process.env.MINDBRICKS_URL + "ai-project-designer/api/v1/agents/product-manager/define-core-project-config",
                method: 'POST',
                body: {
                  project_id: projectId
                },
                isFormData: true
              });

              const coreConfig = coreProjectConfiguration?.data;

              const microServiceName = "auth";
              const saveAuthService = new ApproveAgent({
                projectId,
                agent: "software-engineer",
                name: microServiceName,
                jsonBody: JSON.stringify(coreConfig.authentication),
                contentType: "defined_micro_service",
                success: true,
                status: "created",
                eventName: "software-engineer:design-microservice",
                isApproved: true,
                isActive: true
              });

              await saveAuthService.save();

              producer.send({
                topic: process.env.KAFKA_TOPIC,
                messages: [
                  { value: JSON.stringify({ token, projectId, serviceName: "coreConfig", "coreConfig": coreConfig }) },
                ],
              });
            }
            catch (e) {
              return res.status(400).send("Error while sending socket data")
            }

          }

        }
      }
      getChatMessages = await sendRequest({
        url,
        method: "GET",
        body: { project_id: projectId },
        isFormData: true,
        projectId
      });

      if (getChatMessages?.status != true)
        return next(
          HttpServerError(
            "Error getting chat messages",
            500,
            "Error getting chat messages"
          )
        );
      if (getChatMessages.data.length == 1 && getChatMessages.data[0].content == "") {
        getChatMessages.data[0].content = "Details are enough to proceed"
      }

      let sendDataToFrontend = {
        projectId: projectId,
        data: getChatMessages.data,
        isChatDone,
      };

      return res.status(200).send(sendDataToFrontend);
    } catch (error) {
      return next(error);
    }
  });

  return router
}
