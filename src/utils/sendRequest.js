const axios = require('axios');
const { client } = require("../../redis");

const sendRequest = async ({ url, method, body = null, isFormData = false, token, bearerToken, clientSockets, projectId, sendCurrentSockets,userId }) => {
    try {
        // console.log({
        //     "location":"sendRequest",
        //     url,
        //     method,
        //     body,
        //     token
        // })
        if(token && token.includes('Bearer')){
            token = token.split(' ')[1];
        }

        const response = await axios({
            url,
            method,
            timeout: 300000,
            data: body,
            headers: {
                Authorization: (token ? `Bearer ${token}` : ''),
                Cookie: (token ? `mindbricks-access-token=${token}; Path=/; Domain=mindbricks.com; HttpOnly;`: ''),
                ...(isFormData ? { "Content-Type": "multipart/form-data" } : {})
            }
        });
        // console.log({
        //     data: response.data,
        // })

        return response.data;
    } catch (error) {
        console.log({
            "location":"sendRequest",
            url,
            method,
            body,
            token,
            error: error.message
        })
        console.error('Error in sendRequest:', error.message);
        if(sendCurrentSockets && userId){
            clientSockets = await client.sMembers(`userSockets:${userId}`);
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId && projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('error', JSON.stringify({
                            error: error.message,
                            "reason":"Service axios error from this url "+url
                        }));
                    }
                } catch (err) {
                    console.error("Socket parse error:", err);
                }
            }
        }else if(clientSockets){
            for (const socketId of clientSockets) {
                try {
                    const socketData = JSON.parse(socketId);
                    if (projectId && projectId == socketData.projectId) {
                        io.to(socketData.socketId).emit('error', JSON.stringify({
                            error: error.message,
                            "reason":"Service axios error from this url "+url
                        }));
                    }
                } catch (err) {
                    console.error("Socket parse error:", err);
                }
            }
        }
        return {
            type: "axios",
            success: false,
            message: error.response?.data || error.message
        };
    }
}

module.exports = sendRequest;