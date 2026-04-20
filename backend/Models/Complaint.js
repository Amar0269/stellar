const complaintDb = require('./complaintDb');
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    roomNumber: {
        type: String,
        default: '',
    },
    hostelNumber: {
        type: String,
        default: '',
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'in-progress', 'resolved', 'closed'],
        default: 'pending',
    },
    assignedToRole: {
        type: String,
        default: '',
    },
    /**
     * Roles that can view this complaint.
     * Computed once on creation based on the filer's escalation chain.
     * Querying: { visibleToRoles: { $in: [req.user.role] } }
     */
    visibleToRoles: {
        type: [String],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ComplaintModel = complaintDb.model('complaints', ComplaintSchema);
module.exports = ComplaintModel;
