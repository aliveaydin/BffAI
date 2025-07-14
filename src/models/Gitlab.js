const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    projectId: {
        type: String,
        required: true,
    },
    name: { 
        type: String,
        required: true
    },
    serviceUrl: { 
        type: String,
        required: false
    },
    gitlabId: { 
        type: String,
        required: false
    },
    repoUrl: {
        type: String,
        required: false
    },
    webUrl: {
        type: String,
        required: false
    },
    groupId: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

const gitlab = mongoose.model('gitlab', schema);
module.exports = gitlab;