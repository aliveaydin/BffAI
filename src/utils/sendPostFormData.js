const axios = require('axios');

const sendPostFormData = async ({ url, body = null }) => {
    try {
        // console.log({
        //     "location":"sendPostFormData",
        //     url,
        //     body
        // })
        const form = new FormData();

        for (const key in body) {
            form.append(key, body[key]); 
        }

        const response = await axios.post(url, form, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 60000
        });

        // console.log({
        //     response: response.data,
        // })

        return response.data;
    } catch (error) {
        console.log({
            "location":"sendPostFormData",
            url,
            body
        })
        console.error('Error in sendPostRequest:', error.message);
        return {
            success: false,
            message: error.response?.data || error.message
        };
    }
};

module.exports = sendPostFormData;
