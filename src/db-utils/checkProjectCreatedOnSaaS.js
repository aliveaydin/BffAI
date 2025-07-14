const sendRequest = require('../utils/sendRequest');
const checkUuid = require('../utils/checkUuId');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');

const checkProjectCreatedOnSaas = async ({
    projectId,
    token
}) => {
    try {
        if (!checkUuid(projectId)) return BadRequestError("Project id is invalid", 422, "Project id is invalid");
        const projectUrl = process.env.MINDBRICKS_URL + "project/projects/" + projectId;
        const project = await sendRequest({ url: projectUrl, method: 'GET', token });

        if (project?.status != "OK") return NotFoundError("Project not found", 404, "Project not found");
        return true;
    } catch (error) {
        console.log({error});
        return new Error(`error checking project created on saas ${error.message}`);
    }
}

module.exports = checkProjectCreatedOnSaas;