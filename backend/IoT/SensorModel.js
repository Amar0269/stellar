const { Schema } = require('mongoose');
const iotConnection = require('./db');

const sensorSchema = new Schema({
  roomId:    { type: String, required: true },
  type:      { type: String, enum: ['temperature', 'gas', 'light', 'garbage'], required: true },
  value:     { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

sensorSchema.index({ roomId: 1, type: 1, timestamp: -1 });

module.exports = iotConnection.model('SensorData', sensorSchema);
