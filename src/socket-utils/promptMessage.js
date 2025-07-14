const checkProjectExist = require("../utils/checkProjectExist");
const sendPostFormData = require("../utils/sendPostFormData");
const aiUrl = process.env.AI_URL;
const createProjectFile = require("../db-utils/createProjectFile");
const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
const tryFailedServices = require("../utils/tryFailedServices");
const { client } = require("../../redis");
const ApproveAgent = require("../models/ApproveAgent");
const { producer } = require('../utils/kafka');
const AgentStatus = require("../models/AgentStatus");
const createBffService = require("../route-utils/createBffService");
const softwareEngineer = require("../route-utils/softwareEngineer");

const promptMessage = async ({
    projectId,
    email,
    userId,
    token,
    io,
    socketId,
    isAuto,
    prompt
}) => {
    try {
        const next = (error) => {
            io.to(socketId).emit("error", error.message || error);
        }

        const res = null;
        const req = {
            query: {
                email,
                userId,
                token
            },
            params: {
                projectId
            }
        }

        const projectAndPermission = await checkProjectAndPermission({
            projectId,
            email,
            userId,
            token,
        });

        if (projectAndPermission != true) throw projectAndPermission;

        const isReportCreated = await ApproveAgent.findOne({
            projectId,
            agent: "project-manager",
            name: "Project Description And Scope",
            isActive: true,
        });

        if (isReportCreated) throw "Project manager report is already created .";
        if (!(await checkProjectExist(projectId))) throw "Project not created";
        if (typeof prompt != "string") throw "Prompt must be a string";

        const productManagerUrl = aiUrl + "/agents/product-manager/chat";

        const sendProductManagerData = {
            prompt,
            project_id: projectId,
        };

        const createProjectManager = await sendPostFormData({
            url: productManagerUrl,
            method: "POST",
            body: sendProductManagerData,
            isFormData: true,
        });
        
        const isStarted = await AgentStatus.findOne({
            projectId,
            isStarted: true
        });

        if(!isStarted){
            await AgentStatus.findOneAndUpdate({
                projectId,
            }, {
                isStarted: true,
            }, {
                upsert: true,
                new: true
            });
        }


        if (createProjectManager?.status != true) throw "Error creating project"

        const isDone = createProjectManager.data.is_done;
        const chat = createProjectManager.data.message;

        let sendDataToFrontend = {
            isDone,
            chat
        };

        if (isDone) {

            const sendData = {
                projectId,
                agent: "project-manager",
                ProjectFileName: "Project Description And Scope",
            };

            io.to(socketId).emit("prompt", JSON.stringify({
                projectManager: createProjectManager,
                ...sendData,
                message: "Check socket for logs",
            }));

            const url = aiUrl + "/agents/product-manager/create-report";

            const report = await createProjectFile({
                url,
                io,
                contentType: "markdown",
                projectId,
                ...sendData,
                socketAgent: "project-manager:report",
                userId,
            });

            producer.send({
                topic: process.env.KAFKA_TOPIC,
                messages: [
                    { value: JSON.stringify({ token, projectId, serviceName: "project-manager", "projectManager": report }) },
                ],
            });

            const coreProjectConfiguration = await sendPostFormData({
                url: process.env.MINDBRICKS_URL + "ai-project-designer/api/v1/agents/product-manager/define-core-project-config",
                method: 'POST',
                body: {
                    project_id: projectId
                },
                isFormData: true
            });

            const coreConfig = coreProjectConfiguration?.data;
            const coreConfigInfo = coreConfig?.projectSettings?.basicSettings || {};

            const microServiceName = "auth";
            const saveAuthService = new ApproveAgent({
                projectId,
                agent: "software-engineer",
                name: microServiceName,
                extraInfo: JSON.stringify(coreConfigInfo),
                jsonBody: JSON.stringify(coreConfig.authentication),
                contentType: "defined_micro_service",
                success: true,
                status: "created",
                eventName: "software-engineer:design-microservice",
                isApproved: true,
                isActive: true
            });

            await saveAuthService.save();

            let clientSockets = await client.sMembers(`userSockets:${userId}`);

            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit("core-config", 
                            JSON.stringify(
                                coreConfigInfo
                            )
                        );
                    }
                } catch (err) {
                    console.log("Socket parse error:", err);
                }
            }

            producer.send({
                topic: process.env.KAFKA_TOPIC,
                messages: [
                    { value: JSON.stringify({ token, projectId, serviceName: "coreConfig", "coreConfig": coreConfig }) },
                ],
            });


            if (isAuto) {
                const autoApprove = require("../utils/autoApprove");

                await autoApprove({
                    projectId,
                    "agent": "project-manager",
                    "ProjectFileName": "Project Description And Scope",
                    io,
                    userId,
                    client
                });

                const businessAnalyseUserStories = require("../route-utils/businessAnalyseUserStories");
                await businessAnalyseUserStories(
                    {
                        client,
                        req,
                        res,
                        next,
                        io,
                        isAuto
                    }
                );

                await autoApprove({
                    projectId,
                    "agent": "project-manager",
                    "ProjectFileName": "User Stories",
                    io,
                    userId,
                    client
                });


                const projectMangerPrd = require("../route-utils/projectMangerPrd");

                await projectMangerPrd(
                    {
                        client,
                        req,
                        res,
                        next,
                        io,
                        isAuto
                    }
                );

                await autoApprove({
                    projectId,
                    "agent": "project-manager",
                    "ProjectFileName": "Product Requirements Document",
                    io,
                    userId,
                    client
                });

                const businessAnalyseUseCases = require("../route-utils/businessAnalyseUseCases");
                await businessAnalyseUseCases(
                    {
                        client,
                        req,
                        res,
                        next,
                        io,
                        isAuto
                    }
                );

                await autoApprove({
                    projectId,
                    "agent": "business-analyst",
                    "ProjectFileName": "Use Cases",
                    io,
                    userId,
                    client
                });

                const softwareArchitect = require("../route-utils/softwareArchitect");

                const services = await softwareArchitect(
                    {
                        client,
                        req,
                        res,
                        next,
                        io,
                        isAuto
                    }
                );

                let success;
                for (const [index, service] of services.entries()) {
                    if (index != 0) {
                        try {
                            await autoApprove({
                                projectId,
                                "agent": "software-engineer",
                                "ProjectFileName": services[index - 1].name,
                                success,
                                io,
                                userId,
                                client
                            });   
                        } catch (error) {
                            console.log(error)
                        }
                    }

                    try {
                        console.log({
                            index, service
                        })
                        success = await softwareEngineer(
                            {
                                client,
                                req,
                                res,
                                next,
                                io,
                                isAuto,
                                microServiceName: service.name
                            }
                        );
                    } catch (error) {
                        console.log(error);
                    }
                }

                try {
                    await tryFailedServices({
                        client,
                        req,
                        res,
                        next,
                        io
                    });
                } catch (error) {
                    console.log("Error in tryFailedServices:", error);
                }

                try {
                    await createBffService({
                        client,
                        req,
                        res,
                        next,
                        io,
                        isAuto,
                        microServiceName: "bff"
                    });
                } catch (error) {
                    console.log("Error in createBffService:", error);
                }

            }

            await AgentStatus.findOneAndUpdate({
                projectId,
            }, {
                isFinished: true,
            }, {
                upsert: true,
                new: true
            });



            // await createSpecialService({
            //     serviceName: "panel",
            //     projectId,
            //     token,
            //     clientSockets,
            //     io
            // });

            // await createSpecialService({
            //     serviceName: "document",
            //     projectId,
            //     token,
            //     clientSockets,
            //     io
            // });
            
            clientSockets = await client.sMembers(`userSockets:${userId}`);

            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit("log", 
                            JSON.stringify({
                                type: "finished"
                            })
                        );
                    }
                } catch (err) {
                    console.log("Socket parse error:", err);
                }
            }

            return;
        }


        io.to(socketId).emit("prompt", sendDataToFrontend);
    } catch (error) {
        console.log("message-history")
        console.log(error)
        io.to(socketId).emit("error", JSON.stringify({
            error,
            specialMessage: "promptMessageError"
        }));
    }
}

module.exports = promptMessage;