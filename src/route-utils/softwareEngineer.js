const { producer } = require('../utils/kafka');
const aiUrl = process.env.AI_URL;
const ApproveAgent = require('../models/ApproveAgent');
const ServiceList = require('../models/ServiceList');
const checkProjectAndPermission = require('../db-utils/checkProjectAndPermission');
const checkMicroService = require('../db-utils/checkMicroService');
const createProjectFile = require('../db-utils/createProjectFile');
const sendRequest = require("../utils/sendRequest");
const fixServiceListSorting = require('../utils/fixServiceListSorting');
const updateServiceListStatus = require("../utils/updateServiceListStatus");


const softwareEngineer = async ({ client, req, res, next, io, isAuto, microServiceName }) => {
    const { email, userId } = req.query;
    try {
        console.log(0)
        const token = req.query.token;
        const { projectId } = req.params;
        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission != true) return next(projectAndPermission);
        console.log(1)
        const clientSockets = await client.sMembers(`userSockets:${userId}`);
        const { checkMicroServiceReady, microServiceId } = await checkMicroService({ projectId, microServiceName, clientSockets, io });

        if (checkMicroServiceReady != true) return next(checkMicroServiceReady);

        const agent = "software-engineer";
        const sendFrontendData = {
            projectId,
            agent,
            ProjectFileName: "design-microservice",
        };
        console.log(2)
        if (!isAuto) {
            if (res) {
                return res.status(200).send({
                    ...sendFrontendData,
                    message: "Check socket for logs",
                });
            }
        }
        console.log(3)

        const url = aiUrl + "/agents/software-engineer/design-microservice";

        const sendData = {
            microservice_id: microServiceId
        };

        console.log(4)
        const services = await ServiceList.findOne({ projectId });
        const serviceList = services ? [...services.serviceList] : [];
        if (services) {
            const index = serviceList.findIndex(service => service.name == microServiceName);
            if (index == -1) {
                serviceList.push({
                    name: microServiceName,
                    isAiService: true,
                    status: "designing",
                    isActive: true
                });
            } else {
                serviceList[index].status = "designing";
            }
            await ServiceList.updateOne({ projectId }, { $set: { serviceList } });
        }
        console.log(5)
        for (const socketId of clientSockets) {
            try {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit('service-list', fixServiceListSorting(serviceList));
                }
            } catch (err) {
                console.log("Socket parse error:", err);
            }
        }

        console.log(6)

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
        console.log(20)

        const designedService = (await sendRequest({
            url: aiUrl + `/projects/${projectId}/microservices/${microServiceId}`,
            method: 'GET'
        }))?.data
        console.log({
            designedService
        })
        console.log(21)


        const saveDataKey = `savedData:${projectId}:${microServiceName}`;
        await client.del(saveDataKey);
        await client.zAdd(saveDataKey, {
            score: Date.now(),
            value: JSON.stringify(designedService)
        });
        console.log(22)
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
        console.log(23)
        producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [
                { value: JSON.stringify({ token, projectId, serviceName: microServiceName, designedService }) },
            ],
        });
        console.log(24)

        //FE ile konuşulmalı
        // await updateServiceListStatus({
        //     io,
        //     projectId,
        //     serviceList,
        //     status: "created",
        //     isMessageUpdate:true,
        //     name: microServiceName,
        //     isAiService: true,
        //   });
    

        return true;

    } catch (error) {
        console.log("error in softwareEngineer.js");
        console.log(error)
        if (!isAuto) return next(error);
        return false;
    }
}

module.exports = softwareEngineer;