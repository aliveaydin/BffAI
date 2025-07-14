const mongoose = require("mongoose");

const checkObjectId = (id)=>{
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports = checkObjectId;