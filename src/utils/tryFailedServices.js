const ApproveAgent = require('../models/ApproveAgent');
const softwareEngineer = require('../route-utils/softwareEngineer');

const tryFailedServices = async ({
    client,
    req,
    res,
    next,
    io,
  }) => {
    const { projectId } = req.params;

    const failedServices = await ApproveAgent.find({
      projectId,
      success: false,
    });
    console.log({failedServices})

    for (const failedService of failedServices) {
        const { name } = failedService;
        const softwareEngineerResult = await softwareEngineer({
            client,
            req,
            res,
            next,
            io,
            isAuto: true,
            microServiceName: name,
        });
    
        if (softwareEngineerResult) {
            await ApproveAgent.updateOne(
            { projectId, microServiceName },
            { success: true }
            );
        }
        
    }

}

module.exports = tryFailedServices;