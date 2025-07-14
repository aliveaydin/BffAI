const express = require("express");
const businessAnalyseUserStories = require("../route-utils/businessAnalyseUserStories");

module.exports = (io) => {
  const router = express.Router();
  router.post(
    "/businessanalyseuserstories/:projectId",
    async (req, res, next) => {
      try {
        await businessAnalyseUserStories(
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
  );
  return router;
};
