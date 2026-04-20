const ComplaintModel = require('../Models/Complaint');
const { ROLE_RANK } = require('../config/roles');

/**
 * Static escalation chains per filing role.
 * Each array = ordered list of roles that will receive / can act on the complaint.
 * Higher roles (supervisor → director) are always appended after each chain.
 */
const ESCALATION_CHAINS = {
    student:             ['supervisor', 'warden', 'chiefWarden', 'director'],
    classRepresentative: ['teacher', 'technician', 'supervisor', 'warden', 'chiefWarden', 'director'],
    labAssistant:        ['supervisor', 'warden', 'chiefWarden', 'director'],
    technician:          ['supervisor', 'warden', 'chiefWarden', 'director'],
    teacher:             ['supervisor', 'warden', 'chiefWarden', 'director'],
    supervisor:          ['warden', 'chiefWarden', 'director'],
    warden:              ['chiefWarden', 'director'],
    chiefWarden:         ['director'],
    director:            [],
};

/** Compute visibleToRoles: the filer's own role + their full escalation chain + admin */
const computeVisibleToRoles = (role) => {
    const chain = ESCALATION_CHAINS[role] ?? [];
    const set = new Set([role, ...chain, 'admin']);
    return [...set];
};

/** POST /api/complaint */
const createComplaint = async (req, res) => {
    try {
        const { roomNumber, hostelNumber, subject, description } = req.body;
        const { _id: userId, role, name: userName } = req.user;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required', success: false });
        }

        const visibleToRoles = computeVisibleToRoles(role);
        const assignedToRole = ESCALATION_CHAINS[role]?.[0] ?? '';

        const complaint = await ComplaintModel.create({
            userId,
            userName,
            role,
            roomNumber: roomNumber || '',
            hostelNumber: hostelNumber || '',
            subject,
            description,
            assignedToRole,
            visibleToRoles,
        });

        res.status(201).json({ message: 'Complaint submitted successfully', success: true, complaint });
    } catch (err) {
        console.error('createComplaint error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


/**
 * GET /api/complaint
 *
 * - Own role → own complaints only (plus any they can see)
 * - Higher roles see complaints where their role is in visibleToRoles
 * - Admin sees all
 */
const getComplaints = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        let query;
        if (role === 'admin') {
            query = {};                                      // admin sees everything
        } else {
            query = { visibleToRoles: { $in: [role] } };    // scalable: no role hardcoding
        }

        const complaints = await ComplaintModel.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (err) {
        console.error('getComplaints error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


/**
 * PATCH /api/complaint/:id
 * Updates status. Only roles in visibleToRoles (excluding the filer who is student/lower) can act.
 */
const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role } = req.user;

        const validStatuses = ['pending', 'approved', 'in-progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value', success: false });
        }

        const complaint = await ComplaintModel.findById(id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found', success: false });
        }

        // Only roles that can SEE this complaint (and are not the original filer role) can update it
        // Admin can always update
        const canUpdate =
            role === 'admin' ||
            (complaint.visibleToRoles.includes(role) &&
                ROLE_RANK[role] > ROLE_RANK[complaint.role]);

        if (!canUpdate) {
            return res.status(403).json({ message: 'You are not authorized to update this complaint', success: false });
        }

        complaint.status = status;
        await complaint.save();

        res.status(200).json({ message: 'Complaint status updated', success: true, complaint });
    } catch (err) {
        console.error('updateComplaintStatus error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


module.exports = { createComplaint, getComplaints, updateComplaintStatus };
