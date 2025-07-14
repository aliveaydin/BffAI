const Gitlab = require('../models/Gitlab');
const SystemService = require('../models/SystemService');
const sendRequest = require("../utils/sendRequest");
const updateSystemServiceListStatus = require("../utils/updateSystemServiceListStatus");

const createSpecialService = async ({
    serviceName,
    projectId,
    token,
    clientSockets,
    io
}) => {
    try {
        const systemServiceList = (await SystemService.findOne({
            projectId
        }))?.serviceList || [];

        const now = new Date();
        const createdAt = now;
        const updatedAt = now;

        const version = "1.0.0";
        const buildVersion = "1.0.0";
        const previewVersion = "1.0.0";

        await updateSystemServiceListStatus({
            io,
            projectId,
            serviceList: systemServiceList,
            status: "building",
            createdAt,
            name: serviceName,
            updatedAt,
            version,
            clientSockets
        })

        let repoUrl, webUrl, groupId;

        const adminRepo = await sendRequest({
            url: `${process.env.JOB_SERVICE_URL}api/genesis/getrepo`,
            method: "POST",
            body: { serviceName, projectId },
            token,
        });
        repoUrl = adminRepo?.gitlabProject?.web_url;
        webUrl = adminRepo?.gitlabProject?.web_url;
        groupId = adminRepo?.gitlabProject?.web_url;
        await updateSystemServiceListStatus({
            io,
            projectId,
            serviceList: systemServiceList,
            status: "built",
            createdAt,
            name: serviceName,
            updatedAt,
            version,
            buildVersion,
            clientSockets
        })

        const gitlabId = adminRepo?.gitlabProject?.id;
        await Gitlab.findOneAndUpdate(
            { projectId, name: serviceName },
            {
                gitlabId,
                repoUrl,
                webUrl,
                groupId,
                isActive: true

            },
            { upsert: true, new: true }
        );

        const preview = await sendRequest({
            url: `${process.env.JOB_SERVICE_URL}api/genesis/startpreview`,
            method: "POST",
            body: { serviceName, projectId, gitlabId },
            token,
        });

        const subDomain = preview?.subDomain;

        await updateSystemServiceListStatus({
            io,
            projectId,
            serviceList: systemServiceList,
            status: "started",
            createdAt,
            name: serviceName,
            updatedAt,
            subDomain,
            version,
            buildVersion,
            previewVersion,
            clientSockets
        })
    } catch (error) {
        console.log({
            error
        })
    }

};
module.exports = createSpecialService;