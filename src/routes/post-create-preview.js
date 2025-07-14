const express = require("express");
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");

const aiUrl = process.env.AI_URL;
const ServiceList = require("../models/ServiceList");
const SystemService = require("../models/SystemService");
const Gitlab = require("../models/Gitlab");
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const sendRequest = require("../utils/sendRequest");
const compareVersions = require("../utils/compareVersions");
const updateServiceListStatus = require("../utils/updateServiceListStatus");
const updateSystemServiceListStatus = require("../utils/updateSystemServiceListStatus");
const { sendMessage } = require("../utils/kafka");

module.exports = (io) => {
  const router = express.Router();
  router.post("/createpreview/:projectId", async (req, res, next) => {
    const { email, userId } = req.query;
    
    try {
      const token = req.query.token;
      const serviceName = req.body.serviceName;
      const { projectId } = req.params;

      let serviceUrl,
        repoUrl,
        webUrl,
        groupId,
        createdBy,
        subDomain,
        isAiService,
        version,
        buildVersion,
        previewVersion,
        repoVersion;

      const projectAndPermission = await checkProjectAndPermission({
        projectId,
        email,
        userId,
        token,
      });

      let updatedList;
      if (projectAndPermission != true) return next(projectAndPermission);

      const services =
        serviceName == "panel" || serviceName == "document"
          ? await SystemService.findOne({
              projectId,
              isActive: true,
            })
          : await ServiceList.findOne({
              projectId,
              isActive: true,
            });

      const servicesList = services?.serviceList || [];
      if (servicesList.length == 0) {
        return next(
          BadRequestError(
            "No services found for this project",
            404,
            "No services found"
          )
        );
      }
      updatedList = [...servicesList];

      for (const service of servicesList) {
        if (service.name != serviceName) continue;
        repoVersion = service.buildVersion;
        if (compareVersions(service.version, service.buildVersion) != 0) {
          const repo = await sendRequest({
            url: `${process.env.JOB_SERVICE_URL}api/genesis/getrepo`,
            method: "POST",
            body: { serviceName: serviceName, projectId },
            sendCurrentSockets:true,
            userId,
            token,
          });
          const data = {
            serviceName,
            projectId,
            token,
          };
          sendMessage("mindbricks-bff-service-preview-gitlab-project", {
            data,
            repo,
          });

          service.buildVersion = service.version;
          service.previewVersion = service.version;

          updatedList = servicesList.map((service) => {
            if (service.name === serviceName) {
              repoVersion = service.version;
              return {
                ...service,
                buildVersion: service.version,
                previewVersion: service.version,
              };
            }
            return service;
          });
          serviceUrl = service.serviceUrl;
          repoUrl = repo?.gitlabProject?.web_url;
          webUrl = repo?.gitlabProject?.web_url;
          groupId = repo?.gitlabProject?.web_url;
          const sendData = {
            io,
            projectId,
            serviceList: updatedList,
            status: "building",
            name: serviceName,
            serviceUrl,
            createdBy: service.createdBy,
            isAiService: service.isAiService,
            version: service.version,
            buildVersion: service.version,
            previewVersion: service.previewVersion,
            userId,
          };

          if (serviceName == "panel" || serviceName == "document") {
            sendData.clientSockets = null;
            await updateSystemServiceListStatus(sendData);
          } else {
            await updateServiceListStatus(sendData);
          }

          await Gitlab.findOneAndUpdate(
            { projectId, name: serviceName },
            {
              gitlabId: repo?.gitlabProject?.id,
              serviceUrl,
              repoUrl,
              webUrl,
              groupId,
            },
            { upsert: true, new: true }
          );
        }

        serviceName == "panel" || serviceName == "document"
          ? await SystemService.updateOne(
              { projectId },
              { $set: { serviceList: updatedList } },
              { upsert: true, new: true }
            )
          : await ServiceList.updateOne(
              { projectId },
              { $set: { serviceList: updatedList } },
              { upsert: true, new: true }
            );
      }

      const gitlab = await Gitlab.findOne({
        projectId,
        name: serviceName,
        isActive: true,
      });

      let gitlabId = gitlab?.gitlabId;

      if (!gitlabId) {
        const repo = await sendRequest({
          url: `${process.env.JOB_SERVICE_URL}api/genesis/getrepo`,
          method: "POST",
          body: { serviceName: serviceName, projectId },
          sendCurrentSockets:true,
          userId,
          token,
        });
        const gitlabId = repo?.gitlabProject?.id;

        if (!gitlabId) {
          return next(
            BadRequestError(
              "Gitlab project not found for this service",
              404,
              "Gitlab project not found"
            )
          );
        }


        const data = {
          serviceName,
          projectId,
          token,
        };
        sendMessage("mindbricks-bff-service-preview-gitlab-project", {
          data,
          repo,
        });

        await Gitlab.findOneAndUpdate(
          { projectId, name: serviceName },
          { gitlabId },
          { upsert: true, new: true }
        );
      }

      let preview;
      if (gitlabId) {
        let sendData = {
          io,
          projectId,
          serviceList: updatedList,
          status: "starting",
          name: serviceName,
          serviceUrl,
          createdBy,
          subDomain,
          isAiService,
          version,
          buildVersion,
          previewVersion,
          userId,
        };
        if (serviceName == "panel" || serviceName == "document") {
          sendData.clientSockets = null;
          await updateSystemServiceListStatus(sendData);
        } else {
          await updateServiceListStatus(sendData);
        }
        preview = await sendRequest({
          url: `${process.env.JOB_SERVICE_URL}api/genesis/startpreview`,
          method: "POST",
          body: { serviceName: serviceName, projectId, gitlabId, repoVersion },
          sendCurrentSockets:true,
          userId,
          token,
        });
        subDomain = preview?.subdomain;

        updatedList.forEach((service) => {
          if (service.name == serviceName) {
            serviceUrl = service.serviceUrl;
            createdBy = service.createdBy;
            subDomain = preview?.subdomain;
            isAiService = service.isAiService;
            version = service.version;
            repoVersion = service.buildVersion;
            buildVersion = service.buildVersion;
            previewVersion = service.previewVersion;
          }
        });

        sendData = {
          io,
          projectId,
          serviceList: updatedList,
          status: "started",
          name: serviceName,
          serviceUrl,
          createdBy,
          subDomain,
          isAiService,
          version,
          buildVersion,
          previewVersion,
          userId,
        };

        if (serviceName == "panel" || serviceName == "document") {
          sendData.clientSockets = null;
          await updateSystemServiceListStatus(sendData);
        } else {
          await updateServiceListStatus(sendData);
        }
      }

      if (!subDomain)
        return next(
          HttpServerError({ "preview error": preview }, 400, {
            "preview error": preview,
          })
        );

      const sendDataToFrontend = {
        previewCreated: true,
        projectId,
        subDomain,
        preview,
      };
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      return res.status(200).send(sendDataToFrontend);
    } catch (error) {
      return next(error);
    }
  });
  return router;
};
