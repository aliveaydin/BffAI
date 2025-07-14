const express = require("express");
const projectMangerPrd = require("../route-utils/projectMangerPrd");

module.exports = (io) => {
  const router = express.Router();
  router.post("/projectmanagerprd/:projectId", async (req, res, next) => {
    async (req, res, next) => {
      try {
        await projectMangerPrd(
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
