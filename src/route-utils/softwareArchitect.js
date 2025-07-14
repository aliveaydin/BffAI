const {
    HttpServerError,
    NotAuthorizedError,
    BadRequestError,
    NotFoundError,
  } = require("../utils/errors");
  
  const ServiceList = require("../models/ServiceList");
  const ApproveAgent = require("../models/ApproveAgent");
  const checkProjectExist = require("../utils/checkProjectExist");
  const sendPostFormData = require("../utils/sendPostFormData");
  const aiUrl = process.env.AI_URL;
  const createProjectFile = require("../db-utils/createProjectFile");
  const checkProjectAndPermission = require("../db-utils/checkProjectAndPermission");
  const sendRequest = require("../utils/sendRequest");
  const fixServiceListSorting  = require("../utils/fixServiceListSorting");
  const getAndSaveRandomLogMessage = require("../utils/getAndSaveRandomLogMessage");
  const getLastLog = require("../socket-utils/getLastLog");
  
  const softwareArchitect = async ({ client, req, res, next, io, isAuto }) => {
    const { email, userId } = req.query;
    try {
        const language = process.env.LANGUAGE || "tr";
        const token = req.query.token;
        const { projectId } = req.params;
        const socketAgent = "software-architect:define-microservices";

        const clientSockets = await client.sMembers(`userSockets:${userId}`);
        const url = aiUrl + "/agents/software-architect/define-microservices";

        const projectAndPermission = await checkProjectAndPermission({ projectId, email, userId, token });
        if (projectAndPermission != true) return next(projectAndPermission);

        const isUseCasesApproved = await ApproveAgent.findOne({ projectId, agent: "business-analyst", name: "Use Cases", isApproved: true, isActive: true });
        if (!isUseCasesApproved) return next(BadRequestError("Use cases are not approved", 404, "Use cases are not approved"));

        const sendData = {
            projectId,
            agent: "software-architect",
            ProjectFileName: "micro-services",
        };

        if(!isAuto){
            if(res){
                return res.status(200).send({
                    ...sendData,
                    message: "Check socket for logs",
                });
            }
        }

        await createProjectFile({
            url,
            io,
            contentType: "defined_micro_service",
            agent: "software-architect",
            ProjectFileName: "micro-services",
            projectId,
            socketAgent,
            userId,
            isApproved: true,
            saveData: false
        });

        const microServicesUrl = aiUrl + "/projects/" + projectId + "/microservices";
        const microServices = (await sendRequest({
            url: microServicesUrl,
            method: 'GET',
            isFormData: false,
            projectId
        }))?.data;


        const dbServiceList = ( await ServiceList.findOne({ projectId }))?.serviceList || [];
        const serviceList = [...(microServices.map((microService) => {
            if(microService.name=="bff"|| microService.name=="notification" || microService.name=="auth") return null;
        return {
            name: microService.name,
            isAiService: true,
            isSystemService: false,
            status: "defined", // defined
            isActive: true
        }}
    ))].concat([...dbServiceList]).filter(item=>item)

        const createServiceList = {
            projectId,
            serviceList
        };
        
        await ServiceList.findOneAndUpdate(
            { projectId },
            createServiceList,
            { upsert: true, new: true }
        );

        const message = {
            eventName: "software-architect:define-microservices",
            agent: "software-architect",
            name: "micro-services",
            type: "created",
            message: "Micro services are defined successfully"
        };
        const randomMessage = await getAndSaveRandomLogMessage({
            projectId,
            language,
            agent: socketAgent,
            status:"end",
            extraMessage:message
        });
        for (const socketId of clientSockets) {
            try {
                const socketData = JSON.parse(socketId);
                if (projectId == socketData.projectId) {
                    io.to(socketData.socketId).emit('microServices', microServices);
                    io.to(socketData.socketId).emit('service-list', fixServiceListSorting(serviceList));


                    io.to(socketData.socketId).emit('log', JSON.stringify({
                        ...message,
                        message: randomMessage.message,
                        status: randomMessage.status
                    }));
                    await getLastLog({
                        io,
                        socketId: socketData.socketId,
                        projectId,
                    })
                }
            } catch (err) {
                console.error("Socket parse error:", err);
            }
        }
        

        const approveAgent = new ApproveAgent({
            projectId,
            agent: "software-architect",
            name: "micro-services",
            jsonBody: JSON.stringify(microServices),
            isApproved: true
        });

        await approveAgent.save();
        return microServices;
    } catch (error) {
        console.log({
            error
          })
      if(!isAuto) return next(error);
    }
  }
  
  module.exports = softwareArchitect;