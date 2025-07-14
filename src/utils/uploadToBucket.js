const key = process.env.BUCKET_KEY;
const jwt = require("jsonwebtoken");

const uploadToBucket = async (fileId)=>{
    const bucketId = process.env.BUCKET_ID;
    const bucketUserId = process.env.BUCKET_USER_ID;
    const uploadToken = jwt.sign({
            "action":["read","write","delete","update"],
            "userId":bucketUserId,
            "bucketId":bucketId,
            "fileId":fileId,
    }, key);



    
};

module.exports = uploadToBucket;