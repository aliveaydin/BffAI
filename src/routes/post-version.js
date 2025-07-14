const express = require("express");
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");
const ServiceList = require("../models/ServiceList");
const SystemService = require("../models/SystemService");

const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");

const router = express.Router();
router.post("/versions/:projectId", async (req, res, next) => {
  const { email, userId } = req.query;
  try {
    const { projectId } = req.params;
    const token = req.query.token;
    const serviceName = req.body?.serviceName;

    const projectAndPermission = await checkProjectAndPermission({
      projectId,
      email,
      userId,
      token,
      roleId: 6,
    });
    if (projectAndPermission != true) return next(projectAndPermission);
    if (serviceName) {
      const doc =
        serviceName === "panel" || serviceName === "document"
          ? await SystemService.findOne({ projectId, isActive: true }).lean()
          : await ServiceList.findOne({ projectId, isActive: true }).lean();

      if (
        !doc ||
        !Array.isArray(doc.serviceList) ||
        doc.serviceList.length === 0
      ) {
        return next(
          BadRequestError(
            "No services with the given name cat (panel,document means no sys service,if other other) found for this project",
            404,
            "No services found"
          )
        );
      }

      const version = doc.serviceList.find((s) => s.name === serviceName);
      if (!version) {
        return next(
          NotFoundError(
            `Service '${serviceName}' not found in project`,
            404,
            "Service not found"
          )
        );
      }

      return res.status(200).send({
        serviceName: version.name,
        repoVersion: version.buildVersion,
        previewVersion: version.previewVersion,
      });
    }

    const systemServices = await SystemService.findOne({
      projectId,
      isActive: true,
    });
    const services = await ServiceList.findOne({
      projectId,
      isActive: true,
    });

    const servicesList = services?.serviceList || [];
    const systemServicesList = systemServices?.serviceList || [];
    if (servicesList.length == 0 && systemServicesList.length == 0) {
      return next(
        BadRequestError(
          "No services found for this project",
          404,
          "No services found"
        )
      );
    }

    const versions = [
      ...servicesList.map((s) => ({
        serviceName: s.name,
        repoVersion: s.buildVersion,
        previewVersion: s.previewVersion,
      })),
      ...systemServicesList.map((s) => ({
        serviceName: s.name,
        repoVersion: s.buildVersion,
        previewVersion: s.previewVersion,
      })),
    ];
    const projectVersion =
      systemServicesList[0]?.buildVersion ||
      systemServicesList[0]?.version ||
      "uwu";

    return res.status(200).send({ versions, projectVersion });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
