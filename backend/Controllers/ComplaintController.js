const ComplaintModel = require('../Models/Complaint');

// ─────────────────────────────────────────────────────────────────────────────
// FLOW OVERVIEW
//
// HOSTEL complaints (filed by: student)
//   pending ──[supervisor approve]──► in-progress ──[technician resolve]──► resolved
//   resolved ──[student accept]──► verified   (closed)
//   resolved ──[student reject]──► pending    (loops back to supervisor)
//   pending  ──[supervisor reject]──► rejected (auto-deleted after expiry)
//
// ACADEMIC complaints (filed by: classRepresentative / labAssistant)
//   pending ──[teacher approve]──► in-progress ──[technician resolve]──► resolved
//   resolved ──[filer accept]──► verified   (closed)
//   resolved ──[filer reject]──► pending    (loops back to teacher)
//   pending  ──[teacher reject]──► rejected (auto-deleted after expiry)
//
// VISIBILITY RULES
//   Hostel     → supervisor, warden, chiefWarden, director, admin
//   Academic   → teacher, director, admin
//   Technician → sees everything assigned to them (in-progress)
//   Director   → sees all complaints
//   Admin      → sees all complaints
//   Filer      → always sees their own complaints (queried by userId)
// ─────────────────────────────────────────────────────────────────────────────

// ── Roles that can APPROVE (move to in-progress) per complaint type ───────────
// supervisor approves Hostel, teacher approves Academic
const APPROVER_FOR_TYPE = {
    Hostel:   'supervisor',
    Academic: 'teacher',
    Other:    'supervisor',   // treat Other like Hostel
};

// ── Who can view complaints of each type (besides filer, technician, director, admin) ──
const VIEWERS_FOR_TYPE = {
    Hostel:   ['supervisor', 'warden', 'chiefWarden', 'director', 'admin'],
    Academic: ['teacher', 'director', 'admin'],
    Other:    ['supervisor', 'warden', 'chiefWarden', 'director', 'admin'],
};

// ── Roles that may file complaints ────────────────────────────────────────────
const FILER_ROLES = new Set(['student', 'classRepresentative', 'labAssistant']);

// ── Roles whose ONLY power is viewing (no status changes allowed) ─────────────
const VIEW_ONLY_ROLES = new Set(['warden', 'chiefWarden', 'director', 'admin']);

// ── Status each role is permitted to set ─────────────────────────────────────
const ROLE_ALLOWED_STATUSES = {
    supervisor:          ['in-progress', 'rejected'],
    teacher:             ['in-progress', 'rejected'],
    technician:          ['resolved'],
    student:             ['verified', 'reopened'],
    classRepresentative: ['verified', 'reopened'],
    labAssistant:        ['verified', 'reopened'],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: build visibleToRoles for a NEWLY filed complaint
// Only the approver role + hierarchy viewers get to see it initially.
// The filer is NOT added — they see it via a separate userId query.
// ─────────────────────────────────────────────────────────────────────────────
const buildInitialVisibleRoles = (complaintType) => {
    return [...new Set(VIEWERS_FOR_TYPE[complaintType] ?? VIEWERS_FOR_TYPE.Other)];
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE COMPLAINT
// POST /api/complaint
// ─────────────────────────────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
    try {
        const { roomNumber, hostelNumber, subject, description, complaintType, department } = req.body;
        const { _id: userId, role, name: userName } = req.user;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required.', success: false });
        }

        // labAssistant always files Academic; everyone else must pick a type
        let effectiveType;
        if (role === 'labAssistant') {
            effectiveType = 'Academic';
            if (!department) {
                return res.status(400).json({ message: 'Department is required for lab assistants.', success: false });
            }
        } else {
            if (!complaintType) {
                return res.status(400).json({ message: 'Complaint type is required.', success: false });
            }
            effectiveType = complaintType;
        }

        // Filer role must be allowed to file
        if (!FILER_ROLES.has(role)) {
            return res.status(403).json({ message: 'Your role is not allowed to file complaints.', success: false });
        }

        const approverRole   = APPROVER_FOR_TYPE[effectiveType];
        const visibleToRoles = buildInitialVisibleRoles(effectiveType);

        const complaint = await ComplaintModel.create({
            userId,
            userName,
            role,
            roomNumber:    roomNumber   || '',
            hostelNumber:  hostelNumber || '',
            complaintType: effectiveType,
            department:    department   || '',
            subject,
            description,
            status:        'pending',
            assignedToRole: approverRole,
            visibleToRoles,
        });

        res.status(201).json({ message: 'Complaint submitted successfully.', success: true, complaint });
    } catch (err) {
        console.error('createComplaint error:', err);
        res.status(500).json({ message: 'Internal server error.', success: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET COMPLAINTS
// GET /api/complaint
// Returns { success, active: [...], resolved: [...] }
//   active   = pending | in-progress | rejected
//   resolved = resolved | verified
// ─────────────────────────────────────────────────────────────────────────────
const getComplaints = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        let baseQuery;
        if (role === 'admin' || role === 'director') {
            // See all complaints
            baseQuery = {};
        } else if (FILER_ROLES.has(role)) {
            // Filer only sees their own complaints
            baseQuery = { userId };
        } else {
            // Staff roles see complaints where their role is in visibleToRoles
            baseQuery = { visibleToRoles: { $in: [role] } };
        }

        const all = await ComplaintModel.find(baseQuery).sort({ createdAt: -1 });

        const RESOLVED_STATUSES = new Set(['resolved', 'verified']);
        const active   = all.filter(c => !RESOLVED_STATUSES.has(c.status));
        const resolved = all.filter(c =>  RESOLVED_STATUSES.has(c.status));

        res.status(200).json({ success: true, active, resolved });
    } catch (err) {
        console.error('getComplaints error:', err);
        res.status(500).json({ message: 'Internal server error.', success: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE COMPLAINT STATUS
// PATCH /api/complaint/:id
// Body: { status }
// ─────────────────────────────────────────────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
    try {
        const { id }     = req.params;
        const { status } = req.body;
        const { role, _id: actorId } = req.user;

        // View-only roles cannot act
        if (VIEW_ONLY_ROLES.has(role)) {
            return res.status(403).json({
                message: 'Your role can only view complaints, not update them.',
                success: false,
            });
        }

        // Validate that this role is even allowed to set this status
        const allowedForRole = ROLE_ALLOWED_STATUSES[role] ?? [];
        if (!allowedForRole.includes(status)) {
            return res.status(403).json({
                message: `Your role (${role}) cannot set status '${status}'.`,
                success: false,
            });
        }

        const complaint = await ComplaintModel.findById(id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found.', success: false });
        }

        // ── SUPERVISOR: Approve Hostel complaint ─────────────────────────────
        if (role === 'supervisor' && status === 'in-progress') {
            if (complaint.complaintType !== 'Hostel' && complaint.complaintType !== 'Other') {
                return res.status(403).json({ message: 'Supervisor can only approve Hostel complaints.', success: false });
            }
            if (!['pending', 'reopened'].includes(complaint.status)) {
                return res.status(400).json({ message: 'Complaint is not in a pending/reopened state.', success: false });
            }
            // Authorisation: supervisor must be in the visibility chain
            if (!complaint.visibleToRoles.includes('supervisor')) {
                return res.status(403).json({ message: 'You are not authorised to act on this complaint.', success: false });
            }
            complaint.status         = 'in-progress';
            complaint.assignedToRole = 'technician';
            complaint.rejectionMessage = '';
            complaint.decisionExpiresAt = null;
            // Add technician to visibility; preserve existing viewers
            complaint.visibleToRoles = [
                ...new Set([...complaint.visibleToRoles, 'technician']),
            ];
        }

        // ── SUPERVISOR: Reject Hostel complaint ──────────────────────────────
        else if (role === 'supervisor' && status === 'rejected') {
            if (!['pending', 'reopened'].includes(complaint.status)) {
                return res.status(400).json({ message: 'Can only reject a pending complaint.', success: false });
            }
            if (!complaint.visibleToRoles.includes('supervisor')) {
                return res.status(403).json({ message: 'You are not authorised to act on this complaint.', success: false });
            }
            complaint.status            = 'rejected';
            complaint.rejectionMessage  = 'Complaint rejected by supervisor.';
            complaint.decisionExpiresAt = new Date(Date.now() + 60 * 1000); // 1 min revoke window
            complaint.autoDeleteAt      = null;
            // Restrict to supervisor + admin during revoke window
            complaint.visibleToRoles = ['supervisor', 'warden', 'chiefWarden', 'director', 'admin'];
        }

        // ── TEACHER: Approve Academic complaint ──────────────────────────────
        else if (role === 'teacher' && status === 'in-progress') {
            if (complaint.complaintType !== 'Academic') {
                return res.status(403).json({ message: 'Teacher can only approve Academic complaints.', success: false });
            }
            if (!['pending', 'reopened'].includes(complaint.status)) {
                return res.status(400).json({ message: 'Complaint is not in a pending/reopened state.', success: false });
            }
            if (!complaint.visibleToRoles.includes('teacher')) {
                return res.status(403).json({ message: 'You are not authorised to act on this complaint.', success: false });
            }
            complaint.status         = 'in-progress';
            complaint.assignedToRole = 'technician';
            complaint.rejectionMessage  = '';
            complaint.decisionExpiresAt = null;
            complaint.visibleToRoles = [
                ...new Set([...complaint.visibleToRoles, 'technician']),
            ];
        }

        // ── TEACHER: Reject Academic complaint ───────────────────────────────
        else if (role === 'teacher' && status === 'rejected') {
            if (!['pending', 'reopened'].includes(complaint.status)) {
                return res.status(400).json({ message: 'Can only reject a pending complaint.', success: false });
            }
            if (!complaint.visibleToRoles.includes('teacher')) {
                return res.status(403).json({ message: 'You are not authorised to act on this complaint.', success: false });
            }
            complaint.status            = 'rejected';
            complaint.rejectionMessage  = 'Complaint rejected by teacher.';
            complaint.decisionExpiresAt = new Date(Date.now() + 60 * 1000); // 1 min revoke window
            complaint.autoDeleteAt      = null;
            complaint.visibleToRoles    = ['teacher', 'director', 'admin'];
        }

        // ── TECHNICIAN: Mark resolved ─────────────────────────────────────────
        else if (role === 'technician' && status === 'resolved') {
            if (complaint.status !== 'in-progress') {
                return res.status(400).json({ message: 'Complaint is not in-progress.', success: false });
            }
            if (!complaint.visibleToRoles.includes('technician')) {
                return res.status(403).json({ message: 'You are not authorised to act on this complaint.', success: false });
            }
            complaint.status     = 'resolved';
            complaint.resolvedAt = new Date();
            // Technician stays in visibility; filer sees it via userId query
        }

        // ── FILER: Accept resolution → verified ───────────────────────────────
        else if (FILER_ROLES.has(role) && status === 'verified') {
            // Only the original filer may verify
            if (complaint.userId.toString() !== actorId.toString()) {
                return res.status(403).json({ message: 'Only the person who filed this complaint can verify it.', success: false });
            }
            if (complaint.status !== 'resolved') {
                return res.status(400).json({ message: 'Complaint has not been resolved yet.', success: false });
            }
            complaint.status = 'verified';
        }

        // ── FILER: Reject resolution → loops back to approver ─────────────────
        else if (FILER_ROLES.has(role) && status === 'reopened') {
            if (complaint.userId.toString() !== actorId.toString()) {
                return res.status(403).json({ message: 'Only the person who filed this complaint can reopen it.', success: false });
            }
            if (complaint.status !== 'resolved') {
                return res.status(400).json({ message: 'Complaint has not been resolved yet.', success: false });
            }

            const approverRole = APPROVER_FOR_TYPE[complaint.complaintType];
            complaint.status            = 'pending';
            complaint.resolvedAt        = null;
            complaint.decisionExpiresAt = null;
            complaint.autoDeleteAt      = null;
            complaint.rejectionMessage  = '';
            complaint.assignedToRole    = approverRole;
            // Reset visibility to the correct viewer chain (no filer role — they see via userId)
            complaint.visibleToRoles = buildInitialVisibleRoles(complaint.complaintType);
        }

        else {
            return res.status(400).json({ message: 'Invalid status transition for your role.', success: false });
        }

        await complaint.save();
        res.status(200).json({ message: 'Complaint status updated.', success: true, complaint });
    } catch (err) {
        console.error('updateComplaintStatus error:', err);
        res.status(500).json({ message: 'Internal server error.', success: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND CLEANUP WORKERS
// ─────────────────────────────────────────────────────────────────────────────
const startCleanupWorkers = () => {
    // Every 30s: move expired-rejection-window complaints to filer visibility + set autoDeleteAt
    setInterval(async () => {
        try {
            const expired = await ComplaintModel.find({
                status:            'rejected',
                decisionExpiresAt: { $lte: new Date() },
                autoDeleteAt:      null,
            });

            for (const c of expired) {
                // Filer sees it via userId query; no need to add filer role
                c.visibleToRoles    = ['admin'];
                c.decisionExpiresAt = null;
                c.autoDeleteAt      = new Date(Date.now() + 10 * 60 * 1000); // 10 min to auto-delete
                await c.save();
            }

            if (expired.length > 0) {
                console.log(`[cleanup] ${expired.length} rejected complaint(s) moved to filer visibility.`);
            }
        } catch (err) {
            console.error('[cleanup] Override-window worker error:', err.message);
        }
    }, 30 * 1000);

    // Every 60s: hard-delete complaints whose autoDeleteAt has passed
    setInterval(async () => {
        try {
            const result = await ComplaintModel.deleteMany({
                autoDeleteAt: { $lte: new Date() },
            });
            if (result.deletedCount > 0) {
                console.log(`[cleanup] Auto-deleted ${result.deletedCount} expired complaint(s).`);
            }
        } catch (err) {
            console.error('[cleanup] Auto-delete worker error:', err.message);
        }
    }, 60 * 1000);

    console.log('[cleanup] Background cleanup workers started.');
};

module.exports = { createComplaint, getComplaints, updateComplaintStatus, startCleanupWorkers };
