const express = require("express");
const {
  HttpServerError,
  NotAuthorizedError,
  BadRequestError,
  NotFoundError,
} = require("../utils/errors");

const changeApproveListDataFormat = require("../utils/changeApproveListDataFormat");
const ApproveAgent = require("../models/ApproveAgent");
const sendPostFormData = require("../utils/sendPostFormData");
const sendRequest = require("../utils/sendRequest");
const aiUrl = process.env.AI_URL;
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");

const router = express.Router();
router.get("/approvelist/:projectId", async (req, res, next) => {
  const { email,userId } = req.query;
  try {
    const { projectId } = req.params;
    const token = req.query.token;
    
    const projectAndPermission = await checkProjectAndPermission({
      projectId,
      email,
      userId,
      token,
      roleId:6
    });

    if (projectAndPermission != true) return next(NotAuthorizedError("User is not authorized",401,"User is not authorized"));

    const approvedList = await ApproveAgent.find(
        { projectId, isActive: true },
        { projectId: 1, agent: 1, name: 1,jsonBody:1, isApproved: 1, createdAt: 1, _id: 0 }
    ).lean();


    let sendDataToFrontend = {
      projectId: projectId,
      data: changeApproveListDataFormat(approvedList)
    };

    if (approvedList.length == 0){
      sendDataToFrontend.data = [];
    }


    return res.status(200).send(sendDataToFrontend);
  } catch (error) {
    console.log("error in get-approveList.js");
    console.log(error)
    return next(error);
  }
});

module.exports = router;
