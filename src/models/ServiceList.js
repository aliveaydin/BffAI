const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    projectId: {
        type: String,
        required: true,
    },
    serviceList: {
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

const serviceList = mongoose.model('servielist', schema);
module.exports = serviceList;