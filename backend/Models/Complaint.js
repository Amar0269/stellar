const complaintDb = require('./complaintDb');
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
    {
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
        complaintType: {
            type: String,
            enum: ['Academic', 'Hostel', 'Other'],
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },

        /**
         * Status lifecycle:
         *   pending     → just filed, waiting for teacher
         *   in-progress → teacher approved, technician working on it
         *   resolved    → technician marked done; student yet to verify
         *   verified    → student accepted the resolution (final/closed)
         *   reopened    → student rejected the resolution; restarts from teacher
         *   rejected    → teacher rejected; visible to teacher for 1 min then to filer for 10 min then auto-deleted
         */
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'resolved', 'verified', 'reopened', 'rejected'],
            default: 'pending',
        },

        /** Human-readable message stored with rejection/resolution events */
        rejectionMessage: {
            type: String,
            default: '',
        },

        department: {
            type: String,
            default: '',
        },
        assignedToRole: {
            type: String,
            default: '',
        },

        /**
         * Roles that can currently see this complaint.
         * Mutated as the complaint progresses through the workflow.
         */
        visibleToRoles: {
            type: [String],
            default: [],
        },

        /**
         * Timing fields – all controlled server-side only.
         *
         * decisionExpiresAt: set to now+1min when teacher rejects.
         *   While this is in the future the complaint stays on the teacher's
         *   dashboard so they can revoke the rejection. After expiry the
         *   cleanup worker transfers visibility to the filer and sets autoDeleteAt.
         *
         * autoDeleteAt: set to now+10min when a rejected complaint becomes
         *   visible to the filer. After expiry the cleanup worker hard-deletes
         *   the complaint.
         *
         * resolvedAt: set when technician marks status = resolved.
         *   The frontend polls; once this exists and status === resolved the
         *   card moves to the "Resolved" section.
         */
        decisionExpiresAt: {
            type: Date,
            default: null,
        },
        autoDeleteAt: {
            type: Date,
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,   // adds createdAt + updatedAt, managed by Mongoose
    }
);

const ComplaintModel = complaintDb.model('complaints', ComplaintSchema);
module.exports = ComplaintModel;
