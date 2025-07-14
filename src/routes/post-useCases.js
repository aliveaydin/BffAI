const express = require("express");
const businessAnalyseUseCases = require("../route-utils/businessAnalyseUseCases");

module.exports = (io) => {
  const router = express.Router();
  router.post("/businessanalyseuseCases/:projectId", async (req, res, next) => {
    async (req, res, next) => {
      try {
        await businessAnalyseUseCases(
          {
            req,
            res,
            next,
            io
          }
        );
      } catch (error) {
        return next(error);
      }
    }
  });
  return router;
};
