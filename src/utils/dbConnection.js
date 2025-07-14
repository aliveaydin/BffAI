const mongoose = require('mongoose');
const envDevelopment = process.env.NODE_ENV=="development";
const serviceName = process.env.SERVICE_NAME;
const mongoUri = process.env.MONGO_URI;
const dbConnection = async()=>{
    try {
        const connectUri = envDevelopment ? mongoUri+"/"+serviceName : mongoUri;
        await mongoose.connect(connectUri);
        console.log('Connected to Mongo database');
    } catch (error) {
        console.log('Connection failed');
    }
}


module.exports = dbConnection;