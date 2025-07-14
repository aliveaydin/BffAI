const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    projectId: {
        type: String,
        required: true,
    },
    isFinished: {
        type: Boolean,
        default: false
    },
    isStarted: {
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

const agentStatus = mongoose.model('agentStatus', schema);
module.exports = agentStatus;