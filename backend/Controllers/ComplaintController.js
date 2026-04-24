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

/**
 * Compute visibleToRoles based on the filer's role and the complaint type.
 *
 * Academic      → initially filer + teacher only.
 *                 Teacher approval expands visibility (handled in updateComplaintStatus).
 * labAssistant  → always routed to teacher first, regardless of complaint type.
 *                 Teacher approval expands to technician chain.
 * Hostel        → filer + supervisor, warden, chiefWarden (no teacher/director).
 * Other         → standard escalation chain for the filer's role.
 */
const computeVisibleToRoles = (role, complaintType) => {
    let chain;
    if (complaintType === 'Academic' || role === 'labAssistant') {
        // Both Academic complaints AND all labAssistant complaints start with teacher
        chain = ['teacher'];
    } else if (complaintType === 'Hostel') {
        chain = ['supervisor', 'warden', 'chiefWarden'];
    } else {
        chain = ESCALATION_CHAINS[role] ?? [];
    }
    const set = new Set([role, ...chain, 'admin']);
    return [...set];
};

/** POST /api/complaint */
const createComplaint = async (req, res) => {
    try {
        const { roomNumber, hostelNumber, subject, description, complaintType, department } = req.body;
        const { _id: userId, role, name: userName } = req.user;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required', success: false });
        }

        // labAssistant complaints are always Academic; department name is required
        if (role === 'labAssistant') {
            if (!department) {
                return res.status(400).json({ message: 'Department name is required', success: false });
            }
        } else {
            if (!complaintType) {
                return res.status(400).json({ message: 'Complaint type is required', success: false });
            }
        }

        const effectiveType = role === 'labAssistant' ? 'Academic' : complaintType;
        const visibleToRoles = computeVisibleToRoles(role, effectiveType);
        const assignedToRole = visibleToRoles.find(r => r !== role && r !== 'admin') ?? '';

        const complaint = await ComplaintModel.create({
            userId,
            userName,
            role,
            roomNumber: roomNumber || '',
            hostelNumber: hostelNumber || '',
            complaintType: effectiveType,
            department: department || '',
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
 * Role → statuses that role is permitted to set.
 * View-only roles are blocked explicitly before this map is consulted.
 */
const ROLE_ALLOWED_STATUSES = {
    teacher:    ['approved'],
    technician: ['in-progress', 'resolved'],
    supervisor: ['in-progress', 'resolved', 'closed'],
    admin:      ['pending', 'approved', 'in-progress', 'resolved', 'closed'],
};

/**
 * PATCH /api/complaint/:id
 * Updates status with strict per-role permission checks.
 *
 * Role rules enforced here (mirrors frontend):
 *   - classRepresentative  → view-only, cannot change status
 *   - chiefWarden          → view-only monitor, cannot change status
 *   - teacher              → can only set 'approved'
 *   - technician           → can set 'in-progress' or 'resolved'
 *   - supervisor/warden/director → can set 'in-progress', 'resolved', 'closed'
 *   - admin                → unrestricted
 */
const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role } = req.user;

        // 1. View-only / monitor roles — no updates allowed
        const VIEW_ONLY_ROLES = ['classRepresentative', 'warden', 'chiefWarden', 'director'];
        if (VIEW_ONLY_ROLES.includes(role)) {
            return res.status(403).json({
                message: 'Your role can only monitor complaints, not update them.',
                success: false,
            });
        }

        const complaint = await ComplaintModel.findById(id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found', success: false });
        }

        // 2. Must be in the visibility chain and outrank the filer (or be admin)
        const canSeeAndAct =
            role === 'admin' ||
            (complaint.visibleToRoles.includes(role) &&
                ROLE_RANK[role] > ROLE_RANK[complaint.role]);

        if (!canSeeAndAct) {
            return res.status(403).json({ message: 'You are not authorized to update this complaint', success: false });
        }

        // 3. Validate that the requested status is allowed for this role
        const allowedForRole = ROLE_ALLOWED_STATUSES[role] ?? [];
        if (!allowedForRole.includes(status)) {
            return res.status(403).json({
                message: `Your role (${role}) is not permitted to set status '${status}'.`,
                success: false,
            });
        }

        complaint.status = status;

        // 4. Teacher approves an Academic or labAssistant complaint
        //    → expand visibility to the full resolution chain
        const needsExpansion =
            status === 'approved' &&
            role === 'teacher' &&
            (complaint.complaintType === 'Academic' || complaint.role === 'labAssistant');

        if (needsExpansion) {
            const expanded = new Set([
                ...complaint.visibleToRoles,
                'technician', 'supervisor', 'warden', 'chiefWarden', 'director',
            ]);
            complaint.visibleToRoles = [...expanded];
        }

        await complaint.save();

        res.status(200).json({ message: 'Complaint status updated', success: true, complaint });
    } catch (err) {
        console.error('updateComplaintStatus error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};


module.exports = { createComplaint, getComplaints, updateComplaintStatus };
