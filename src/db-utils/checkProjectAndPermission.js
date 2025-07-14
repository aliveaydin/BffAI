const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const checkProjectCreatedOnSaaS = require('./checkProjectCreatedOnSaaS');
const checkUserAuthority = require('./checkUserAuthority');

const checkProjectAndPermission = async ({
    email,projectId, userId, token, roleId=3
}) => {
    try {
        const saasProjectExist = await checkProjectCreatedOnSaas({projectId,token});

        if (saasProjectExist!=true) return saasProjectExist;
    
        const userPermissionOnProject = await checkUserAuthority({ email,userId, projectId, token, roleId });

        if (!userPermissionOnProject) return BadRequestError("User is not authorized to perform this action",404);   
        return true;
    } catch (error) {
        return new Error(`error checking project and permission ${error.message}`);
    }
}

module.exports = checkProjectAndPermission;