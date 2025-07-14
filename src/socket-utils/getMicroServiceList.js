const ServiceList = require('../models/ServiceList');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');

const getMicroServiceList = async ({
    projectId,
    email,
    userId,
    token
}) => {
    try {
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission!=true) throw projectAndPermission;

        const services = ( await ServiceList.findOne({
            projectId
        })) || {
            serviceList: []
        };
    
        return services.serviceList;   
    } catch (error) {
        console.log(error)
    }
}

module.exports = getMicroServiceList;