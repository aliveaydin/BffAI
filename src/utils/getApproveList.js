const ApproveAgent = require('../models/ApproveAgent');

const getApproveList = async (
    projectId
) => {
    try {
        const approvedList = await ApproveAgent.find(
            { projectId, isActive: true },
            { projectId: 1, agent: 1, name: 1,jsonBody:1,success: 1, isApproved: 1, status:1, contentType:1, createdAt:1, eventName:1, _id: 0 }
        ).lean();

        return approvedList

    } catch (error) {
        console.log("approvelisterror")
        console.log(error)
    }
}

module.exports = getApproveList;