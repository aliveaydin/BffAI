const sendRequest = require('./sendRequest');

const getServiceList = async ({projectId,token}) => {   
    try {
        const url = `${process.env.MINDBRICKS_URL}design/services/${projectId}`;

        const response = (await sendRequest({
            token,
            url,
            method: 'GET',
            isFormData: false
        }));

        return response;  
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    } 
}


module.exports = getServiceList;    