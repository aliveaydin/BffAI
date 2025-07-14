const ApproveAgent = require('../models/ApproveAgent');
const getAllFailedProjects = require('./getAllFailedProjects');

const getLastStepOfFailedProjects = async () => {
  try {
    const failedProjects = await getAllFailedProjects();

    const lastSteps = await ApproveAgent.aggregate([
      {
        $match: {
          projectId: { $in: failedProjects },
          isActive: true
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $group: {
          _id: "$projectId",
          latest: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: {
          newRoot: "$latest"
        }
      }
    ]);

    return lastSteps;
  } catch (error) {
    console.error('Error in getLastStepOfFailedProjects:', error);
    return [];
  }
};

module.exports = getLastStepOfFailedProjects;
