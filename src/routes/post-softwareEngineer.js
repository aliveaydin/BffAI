const express = require('express');
const softwareEngineer = require('../route-utils/softwareEngineer');

module.exports = (io) => {
    const router = express.Router();
    router.post('/softwareengineer/:projectId', async (req, res, next) => {
        const { email,userId } = req.query;
        try {
            await softwareEngineer(
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