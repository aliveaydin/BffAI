const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    projectId: {
        type: String,
        required: true,
    },
    agent: { 
        type: String,
        required: true,
        enum: ["project-manager", "business-analyst", "software-architect","software-engineer"],
    },
    name: { 
        type: String,
        required: true
    },
    jsonBody: { 
        type: String,
        required: true
    },
    extraInfo: {
        type: String,
        required: false
    },
    contentType:{
        type: String,
        required: false,
        enum: ["user_story", "use_case", "defined_micro_service","report","markdown","designed_micro_service"],
    },
    success: {
        type: Boolean,
        required: false,
    },
    status: {
        type: String,
        required: false,
        enum: ["passive", "creating", "created","defined","designing","designed"],
        default: "passive"
    },
    eventName: {
        type: String,
        required: false
    },
    jsonVersion: {
        type: String,
        default: "1.0.0"
    },
    buildVersion: {
        type: String,
        default: "1.0.0"
    },
    previewVersion: {
        type: String,
        default: "1.0.0"
    },
    isApproved: { 
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

const approveList = mongoose.model('approveAgent', schema);
module.exports = approveList;