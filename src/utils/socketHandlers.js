const { client } = require("../../redis");
const approveFile = require("../socket-utils/approveFile");
const getApproveList = require("../socket-utils/getApproveList");
const promptMessage = require("../socket-utils/promptMessage");
const getChatHistory = require('../socket-utils/getChatHistory');
const getSocketAgentStatus = require("../socket-utils/getSocketAgentStatus")
const isProjectFinished = require("./isProjectFinished");
const isProjectStarted = require("./isProjectStarted");
const getMicroServiceList = require("../socket-utils/getMicroServiceList");
const getSystemServiceList = require("../socket-utils/getSystemServiceList");
const fixServiceListSorting = require("../utils/fixServiceListSorting");
const getLogs = require("../socket-utils/getLogs");
const getLastLog = require("../socket-utils/getLastLog");
const getChatLastLog = require("../socket-utils/getChatLastLog");
const getCoreConfig = require("../socket-utils/getCoreConfig");
const getProjectVersion = require("../socket-utils/getProjectVersion");


async function approveList(socket, io) {
    socket.on("approve list", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;

            await getApproveList({
                email,
                userId,
                token,
                projectId,
                io,
                socketId
            });

        } catch (error) {
            console.error("Disconnect işlemi sırasında hata:", error);
        }
    });
}

async function approve(socket, io) {
    socket.on("approve", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const ProjectFileName = data.ProjectFileName;
            const agent = data.agent;

            const approvedFile = await approveFile({
                projectId,
                agent,
                ProjectFileName,
                io,
                socketId
            });

            io.to(socketId).emit("approved", approvedFile);

        } catch (error) {
            console.error("Disconnect işlemi sırasında hata:", error);
        }
    });
}

async function messageHistory(socket, io) {
    socket.on("message-history", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const agent = data.agent;
            const email = socket.email;
            const token = socket.token;

            await getChatHistory({
                projectId,
                email,
                userId,
                token,
                agent,
                io,
                socketId
            });

        } catch (error) {
            console.error("Message-history işlemi sırasında hata:", error);
        }
    });
}


async function prompt(socket, io) {
    socket.on("prompt", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const prompt = data.prompt;
            const email = socket.email;
            const token = socket.token;
            const isAuto = data.isAuto || true;

            await promptMessage({
                projectId,
                email,
                userId,
                token,
                isAuto,
                prompt,
                io,
                socketId
            });

        } catch (error) {
            console.error("Message-history işlemi sırasında hata:", error);
        }
    });
}




async function agentStatus(socket, io) {
    socket.on("agent-status", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;

            await getSocketAgentStatus({
                projectId,
                io,
                socketId
            });

        } catch (error) {
            console.error("Message-history işlemi sırasında hata:", error);
        }
    });
}




async function microServiceList(socket, io) {
    socket.on("service-list", async (data) => {
        const socketId = socket.id;
        try {
            const projectId = data.projectId;
            const userId = socket.userId;
            const email = socket.email;
            const token = socket.token;
            const serviceList = await getMicroServiceList({
                projectId,
                email,
                userId,
                token,
                io,
                socketId
            });
            io.to(socketId).emit("service-list", fixServiceListSorting(serviceList));
        } catch (error) {
            console.error("Service-list işlemi sırasında hata:", error);
        }
    });
}



async function systemServiceList(socket, io) {
    socket.on("system-service-list", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getSystemServiceList({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("System-service-list işlemi sırasında hata:", error);
        }
    });
}


async function logsHistory(socket, io) {
    socket.on("chat-log-history", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getLogs({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Get logs işlemi sırasında hata:", error);
        }
    });
}


async function coreConfig(socket, io) {
    socket.on("core-config", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getCoreConfig({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Get logs işlemi sırasında hata:", error);
        }
    });
}

async function log(socket, io) {
    socket.on("log", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getLastLog({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Get logs işlemi sırasında hata:", error);
        }
    });
}

async function chatLastLog(socket, io) {
    socket.on("chat-log", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getChatLastLog({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("Get chat log işlemi sırasında hata:", error);
        }
    });
}

async function projectVersion(socket, io) {
    socket.on("project-version", async (data) => {
        const socketId = socket.id;
        const userId = socket.userId;
        const email = socket.email;
        const token = socket.token;
        try {
            const projectId = data.projectId;
            await getProjectVersion({
                projectId,
                socketId, 
                io,
                userId,
                email,
                token
            });
        } catch (error) {
            console.error("getProjectVersion işlemi sırasında hata:", error);
        }
    });
}


async function connected(socket, io) {
    try {
        const userId = socket.userId;
        const socketId = socket.id;
        const projectId = socket.projectId;
        const email = socket.email;
        const token = socket.token;

        if (!userId) {
            console.log(`⚠️ Kullanıcı ID'si eksik! Socket: ${socketId}`);
            return;
        }
        
        if (!projectId) {
            console.log(`⚠️ Proje ID'si eksik! Socket: ${socketId}`);
            return;
        } 

        await client.sAdd(`userSockets:${userId}`, JSON.stringify({ socketId, projectId }));
        await client.hSet("socketUser", socketId, userId);
        
        const isProjectFinishedStatus = await isProjectFinished(projectId);
        
        if(isProjectFinishedStatus){
            io.to(socketId).emit("log", 
                JSON.stringify({
                    type: "finished"
                })
            );  
        }
        if(!isProjectFinishedStatus){
            const isProjectStartedStatus = await isProjectStarted(projectId);
            if(isProjectStartedStatus){
                io.to(socketId).emit("log", 
                    JSON.stringify({
                        type: "started"
                    })
                );    
            } else {
                io.to(socketId).emit("log", 
                    JSON.stringify({
                        type: "not-started"
                    })
                );    
            }
        }

        await getProjectVersion({
            projectId,
            email,
            userId,
            token,
            io,
            socketId
        });

    } catch (error) {
        console.error("Bağlantı sırasında hata:", error);
    }
}

function disconnect(socket, io) {
    socket.on("disconnect", async () => {
        const socketId = socket.id;
        try {
            // Socket ID'den kullanıcıyı bul
            const userId = await client.hGet("socketUser", socketId);

            if (userId) {
                const members = await client.sMembers(`userSockets:${userId}`);
                for (const member of members) {
                    try {
                        const parsed = JSON.parse(member);
                        if (parsed.socketId === socketId) {
                            await client.sRem(`userSockets:${userId}`, member);
                            continue; 
                        }
                    } catch (err) {
                        console.error("Geçersiz JSON:", member);
                    }
                }

                await client.hDel("socketUser", socketId);

                const remainingSockets = await client.sCard(`userSockets:${userId}`);
                if (remainingSockets === 0) {
                    await client.del(`userSockets:${userId}`);
                    console.log(`Kullanıcı tamamen çıktı: ${userId}`);
                }

                console.log(`Kullanıcı bağlantısı kesildi: ${userId} -> ${socketId}`);
            }
        } catch (error) {
            console.error("Disconnect işlemi sırasında hata:", error);
        }
    });
}

module.exports = {
    approve,
    connected,
    disconnect,
    approveList,
    messageHistory,
    agentStatus,
    prompt,
    microServiceList,
    systemServiceList,
    logsHistory,
    log,
    chatLastLog,
    coreConfig,
    projectVersion
};
