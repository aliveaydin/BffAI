const sendData = require("./sendRequest");

const checkProjectExist = async(projectId)=>{
    const aiUrl = process.env.AI_URL + "/projects/"+projectId+"/status";
    const status = await sendData({url:aiUrl, method: 'GET'});

    if(status?.status === true) return true;
    return false;
}

module.exports = checkProjectExist;