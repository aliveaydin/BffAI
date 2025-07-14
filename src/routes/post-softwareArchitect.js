const express = require('express');
const softwareArchitect = require('../route-utils/softwareArchitect');

module.exports = (io) => {
    const router = express.Router();
    router.post('/softwarearchitect/:projectId', async (req, res, next) => {
        try {
            await softwareArchitect(
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
    });
    return router;
}