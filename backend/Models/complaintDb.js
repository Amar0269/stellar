const mongoose = require('mongoose');

const COMPLAINT_MONGO_URI = process.env.COMPLAINT_MONGO_URI;

const complaintDb = mongoose.createConnection(COMPLAINT_MONGO_URI);

complaintDb.on('connected', () => console.log('Complaint DB connected'));
complaintDb.on('error', (err) => console.error('Complaint DB connection error:', err));

module.exports = complaintDb;
