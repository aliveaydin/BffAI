const express = require('express');
const router = express.Router();


router.post('/project/:projectId', async (req, res, next) => {
    try {
        const { userId } = req.query;
        const { projectId } = req.params;

        const sendData = {
            userId,
            projectId,
        };

        return res.status(200).send(sendData);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
