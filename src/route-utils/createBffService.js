const { producer } = require('../utils/kafka');
const aiUrl = process.env.AI_URL;
const ApproveAgent = require('../models/ApproveAgent');
const ServiceList = require('../models/ServiceList');

const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');
const checkMicroService = require('../db-utils/checkMicroService');
const createProjectFile = require('../db-utils/createProjectFile');
const sendRequest = require("../utils/sendRequest");
const fixServiceListSorting = require('../utils/fixServiceListSorting');
const autoApprove = require('../utils/autoApprove');


const createBffService = async ({ client, req, res, next, io, isAuto, microServiceName }) => {
    const { email, userId } = req.query;
    try {
        const token = req.query.token;
        const { projectId } = req.params;
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission != true) return next(projectAndPermission);

        const clientSockets = await client.sMembers(`userSockets:${userId}`);

        const agent = "software-engineer";
        const sendFrontendData = {
            projectId,
            agent,
            ProjectFileName: "design-microservice",
        };

        if (!isAuto) {
            if (res) {
                return res.status(200).send({
                    ...sendFrontendData,
                    message: "Check socket for logs",
                });
            }
        }


        const url = aiUrl + "/agents/software-architect/design-bff-service";

        const sendData = {
            project_id: projectId
        };


        let services = await ServiceList.findOne({ projectId });

        if (services) {
            const index = services.serviceList.findIndex(service => service.name == microServiceName);
            if (index == -1) {
                services.serviceList.push({
                    name: microServiceName,
                    isAiService: true,
                    status: "designing",
                    isActive: true
                });
            } else {
                services.serviceList[index].status = "designing";
            }
            await ServiceList.updateOne({ projectId }, { $set: { serviceList: services.serviceList } });
        }

        for (const socketId of clientSockets) {
            try {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit('service-list', fixServiceListSorting(services.serviceList));
                }
            } catch (err) {
                console.log("Socket parse error:", err);
            }
        }



        await createProjectFile({
            url,
            io,
            contentType: "designed_micro_service",
            agent,
            ProjectFileName: microServiceName,
            sendData,
            projectId,
            socketAgent: "software-engineer:design-microservice",
            userId
        });


        const designedServiceUrl = aiUrl + "/projects/"+projectId+"/patterns";

        const designedService = (await sendRequest({
            url: designedServiceUrl,
            method: 'GET',
            isFormData: false,
            projectId
        }))?.data?.bffService;

        const saveDataKey = `savedData:${projectId}:${microServiceName}`;
        await client.del(saveDataKey);
        await client.zAdd(saveDataKey, {
            score: Date.now(),
            value: JSON.stringify(designedService)
        });

        const approveAgentJson = {
            projectId,
            agent,
            name: microServiceName
        }

        await ApproveAgent.updateOne(approveAgentJson, {
            $set: {
                jsonBody: JSON.stringify(designedService),
            }
        }, { upsert: true });


        await autoApprove({
            projectId,
            "agent": "software-engineer",
            "ProjectFileName": microServiceName,
            success: true,
            io,
            userId,
            client
        });


        producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [
                { value: JSON.stringify({ token, projectId, serviceName: microServiceName, designedService }) },
            ],
        });

        return true;

    } catch (error) {
        console.log("error in softwareEngineer.js");
        console.log(error)
        if (!isAuto) return next(error);
        return false;
    }
}

module.exports = createBffService;