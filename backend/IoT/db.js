const mongoose = require('mongoose');

const iotConnection = mongoose.createConnection(process.env.MONGO_IOT_URI);

iotConnection.on('connected', () => console.log('✅ IoT Sensor DB Connected (MongoDB — for sensor data storage)'));
iotConnection.on('error', (err) => console.log('❌ IoT Sensor DB Connection Failed:', err.message));

module.exports = iotConnection;
