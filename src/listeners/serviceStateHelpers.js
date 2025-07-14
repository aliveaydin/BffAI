const Gitlab = require("../models/Gitlab");
const { sendMessage } = require("../utils/kafka");
const sendRequest = require("../utils/sendRequest");
const updateServiceListStatus = require("../utils/updateServiceListStatus");
const ServiceList = require("../models/ServiceList");
const sendMessageToUsersOnSocket = require("../utils/sendMessageToUsersOnSocket");

async function updateServiceStatus(io, projectId, serviceList, status, name, url, createdBy, subDomain, isAiService, version, buildVersion, previewVersion, isSpecial) {
    await updateServiceListStatus({
        io,
        projectId,
        serviceList,
        status,
        isMessageUpdate: !isSpecial,
        createdAt: new Date(),
        updatedAt: new Date(),
        name,
        serviceUrl: url,
        createdBy,
        subDomain,
        isAiService,
        version,
        buildVersion,
        previewVersion,
    });
}

async function createGitlabRepo(serviceName, projectId, token) {
    const repo = await sendRequest({
        url: `${process.env.JOB_SERVICE_URL}api/genesis/getrepo`,
        method: "POST",
        body: { serviceName, projectId, repoVersion: "1.0.0" },
        token,
    });
    if (repo) {
        sendMessage("mindbricks-bff-service-preview-gitlab-project", {
            data: { serviceName, projectId, token },
            repo,
        });
    }
    return repo;
}

async function startPreview(serviceName, projectId, gitlabId, token) {
    const preview = await sendRequest({
        url: `${process.env.JOB_SERVICE_URL}api/genesis/startpreview`,
        method: "POST",
        body: { serviceName, projectId, gitlabId },
        token,
    });
    return preview;
}

async function handleServiceCreation(io, projectId, serviceName, serviceUrl, version, createdBy, token) {
    let bffAiServices = await ServiceList.findOne({ projectId });
    let serviceList = bffAiServices?.serviceList || [];
    const isSpecialService = (serviceName == "bff" || serviceName == "auth" || serviceName == "notification") && createdBy.type == "agent";

    await updateServiceStatus(io, projectId, serviceList, "building", serviceName, serviceUrl, createdBy, null, false, version, "1.0.0", "1.0.0", isSpecialService);
    const repo = await createGitlabRepo(serviceName, projectId, token);
    await updateServiceStatus(io, projectId, serviceList, "built", serviceName, serviceUrl, createdBy, null, false, version, "1.0.0", "1.0.0", isSpecialService);
    const gitlabId = repo?.gitlabProject?.id;
    await Gitlab.findOneAndUpdate(
        { projectId, name: serviceName },
        { $set: { gitlabId, serviceUrl, repoUrl: repo?.gitlabProject?.web_url, webUrl: repo?.gitlabProject?.web_url, groupId: repo?.gitlabProject?.group_id } },
        { upsert: true, new: true }
    );
    await updateServiceStatus(io, projectId, serviceList, "starting", serviceName, serviceUrl, createdBy, null, false, version, "1.0.0", "1.0.0", isSpecialService);
    const preview = await startPreview(serviceName, projectId, gitlabId, token);
    await updateServiceStatus(io, projectId, serviceList, "started", serviceName, serviceUrl, createdBy, preview?.subdomain, false, version, "1.0.0", "1.0.0", isSpecialService);

    bffAiServices = await ServiceList.findOne({ projectId });
    serviceList = bffAiServices?.serviceList || [];

    if (!bffAiServices) {
        serviceList = [
            {
                name: serviceName,
                serviceName,
                serviceUrl,
                subDomain: preview?.subdomain,
                status: "started",
                version,
                buildVersion: "1.0.0",
                previewVersion: "1.0.0",
                createdBy,
            },
        ];

        const bffAiServicesJson = {
            projectId,
            serviceList,
        };

        await ServiceList.findOneAndUpdate({ projectId }, bffAiServicesJson, {
            upsert: true,
            new: true,
        });

        sendMessageToUsersOnSocket({
            projectId,
            serviceList,
            io,
            client,
        });
    } else {
        await updateServiceStatus(io, projectId, serviceList, "started", serviceName, serviceUrl, createdBy, preview?.subdomain, false, version, "1.0.0", "1.0.0", isSpecialService);
    }
}


module.exports = {
    handleServiceCreation
};
