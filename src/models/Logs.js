const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    projectId: {
        type: String,
        required: true,
    },
    logList: {
        type: Array,
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

const logList = mongoose.model('log', schema);
module.exports = logList;