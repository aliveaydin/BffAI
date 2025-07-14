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
        console.error('Error in sendPostRequest:', error.message);
        throw new HttpServerError("Error sending post form data");
    }
};

module.exports = sendPostFormData;
