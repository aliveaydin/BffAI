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
        console.error('Error in sendRequest:', error.message);
        throw new HttpServerError("Error sending request");
    }
}

module.exports = sendRequest;