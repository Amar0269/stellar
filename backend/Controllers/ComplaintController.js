const ComplaintModel = require('../Models/Complaint');
const { ROLE_RANK } = require('../config/roles');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Roles that are purely view-only in the complaint workflow.
 * They can see complaints but take no approval/action.
 */
const VIEW_ONLY_ROLES = new Set(['warden', 'chiefWarden', 'director', 'admin', 'supervisor']);

/**
 * Which statuses each role may set via PATCH /api/complaint/:id.
 * Roles absent from this map cannot set any status (view-only).
 */
const ROLE_ALLOWED_STATUSES = {
    teacher:      ['in-progress', 'rejected'],  // approve → in-progress; reject → rejected
    technician:   ['resolved'],
    student:      ['verified', 'reopened'],      // accept / reject a resolved complaint
    labAssistant: ['verified', 'reopened'],
    classRepresentative: ['verified', 'reopened'],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the initial visibleToRoles for a new complaint.
 *
 * student / labAssistant / classRepresentative Academic complaints → teacher first.
 * Hostel complaints → supervisor chain.
 * Other → same as Hostel for now (supervisor chain).
 */
const computeInitialVisibleRoles = (role, complaintType) => {
    let chain;
    if (complaintType === 'Academic' || role === 'labAssistant') {
        chain = ['teacher'];
    } else if (complaintType === 'Hostel') {
        chain = ['supervisor', 'warden', 'chiefWarden'];
    } else {
        chain = ['supervisor', 'warden', 'chiefWarden'];
    }
    const set = new Set([role, ...chain, 'admin']);
    return [...set];
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE COMPLAINT
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/complaint */
const createComplaint = async (req, res) => {
    try {
        const { roomNumber, hostelNumber, subject, description, complaintType, department } = req.body;
        const { _id: userId, role, name: userName } = req.user;

        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required', success: false });
        }

        if (role === 'labAssistant') {
            if (!department) {
                return res.status(400).json({ message: 'Department name is required', success: false });
            }
        } else {
            if (!complaintType) {
                return res.status(400).json({ message: 'Complaint type is required', success: false });
            }
        }

        const effectiveType    = role === 'labAssistant' ? 'Academic' : complaintType;
        const visibleToRoles   = computeInitialVisibleRoles(role, effectiveType);
        const assignedToRole   = visibleToRoles.find(r => r !== role && r !== 'admin') ?? '';

        const complaint = await ComplaintModel.create({
            userId,
            userName,
            role,
            roomNumber:    roomNumber  || '',
            hostelNumber:  hostelNumber || '',
            complaintType: effectiveType,
            department:    department  || '',
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

// ─────────────────────────────────────────────────────────────────────────────
// GET COMPLAINTS  (split into active / resolved lists)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/complaint
 *
 * Returns:
 *   { success, active: [...], resolved: [...] }
 *
 * active   = pending | in-progress | reopened | rejected  (visible to requester)
 * resolved = resolved | verified                          (visible to requester)
 */
const getComplaints = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        // Build base visibility query
        let baseQuery;
        if (role === 'admin') {
            baseQuery = {};
        } else {
            baseQuery = { visibleToRoles: { $in: [role] } };
        }

        const all = await ComplaintModel.find(baseQuery).sort({ createdAt: -1 });

        const RESOLVED_STATUSES = new Set(['resolved', 'verified']);
        const active   = all.filter(c => !RESOLVED_STATUSES.has(c.status));
        const resolved = all.filter(c =>  RESOLVED_STATUSES.has(c.status));

        res.status(200).json({ success: true, active, resolved });
    } catch (err) {
        console.error('getComplaints error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE COMPLAINT STATUS  (core workflow state machine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/complaint/:id
 * Body: { status }
 *
 * State machine:
 *
 *  pending   ──[teacher approve]──► in-progress  (visibleToRoles += technician)
 *  pending   ──[teacher reject] ──► rejected      (decisionExpiresAt = now+1m)
 *  rejected  ──[teacher revoke]──► pending        (decisionExpiresAt cleared, revert roles)
 *
 *  in-progress ──[technician resolve]──► resolved  (resolvedAt = now; filer can verify)
 *
 *  resolved ──[student accept]──► verified   (permanent close)
 *  resolved ──[student reject]──► reopened → reset to pending + back to teacher
 */
const updateComplaintStatus = async (req, res) => {
    try {
        const { id }     = req.params;
        const { status } = req.body;
        const { role, _id: actorId } = req.user;

        // 1. View-only roles may not act
        if (VIEW_ONLY_ROLES.has(role)) {
            return res.status(403).json({
                message: 'Your role can only monitor complaints, not update them.',
                success: false,
            });
        }

        const complaint = await ComplaintModel.findById(id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found', success: false });
        }

        // 2. The acting role must be in the visibility chain (or admin)
        if (role !== 'admin' && !complaint.visibleToRoles.includes(role)) {
            return res.status(403).json({ message: 'You are not authorized to update this complaint', success: false });
        }

        // 3. Validate the requested status is allowed for this role
        const allowedForRole = ROLE_ALLOWED_STATUSES[role] ?? [];
        if (!allowedForRole.includes(status)) {
            return res.status(403).json({
                message: `Your role (${role}) is not permitted to set status '${status}'.`,
                success: false,
            });
        }

        // ── State machine transitions ──────────────────────────────────────

        // TEACHER: Approve (set to in-progress, hand off to technician)
        if (role === 'teacher' && status === 'in-progress') {
            complaint.status        = 'in-progress';
            complaint.assignedToRole = 'technician';
            complaint.decisionExpiresAt = null;
            complaint.rejectionMessage  = '';

            // Expand visibility to technician + higher authorities
            const expanded = new Set([
                ...complaint.visibleToRoles,
                'technician', 'supervisor', 'warden', 'chiefWarden', 'director',
            ]);
            complaint.visibleToRoles = [...expanded];
        }

        // TEACHER: Reject
        else if (role === 'teacher' && status === 'rejected') {
            complaint.status             = 'rejected';
            complaint.rejectionMessage   = 'Complaint marked invalid';
            complaint.decisionExpiresAt  = new Date(Date.now() + 60 * 1000); // 1 minute
            // Keep visible ONLY to teacher (and admin) during override window
            complaint.visibleToRoles = [complaint.role, 'teacher', 'admin'].filter(
                (r, i, arr) => arr.indexOf(r) === i
            );
            complaint.autoDeleteAt = null;
        }

        // TECHNICIAN: Mark resolved
        else if (role === 'technician' && status === 'resolved') {
            complaint.status     = 'resolved';
            complaint.resolvedAt = new Date();
            // Re-add the filer so they can see and verify it
            const expandedResolved = new Set([...complaint.visibleToRoles, complaint.role]);
            complaint.visibleToRoles = [...expandedResolved];
        }

        // STUDENT / labAssistant: Accept resolution → verified (closed)
        else if (['student', 'labAssistant', 'classRepresentative'].includes(role) && status === 'verified') {
            if (complaint.status !== 'resolved') {
                return res.status(400).json({ message: 'Complaint is not in resolved state', success: false });
            }
            complaint.status = 'verified';
        }

        // STUDENT / labAssistant: Reject resolution → reopen (send back to teacher)
        else if (['student', 'labAssistant', 'classRepresentative'].includes(role) && status === 'reopened') {
            if (complaint.status !== 'resolved') {
                return res.status(400).json({ message: 'Complaint is not in resolved state', success: false });
            }
            complaint.status             = 'pending';
            complaint.resolvedAt         = null;
            complaint.decisionExpiresAt  = null;
            complaint.autoDeleteAt       = null;
            complaint.rejectionMessage   = '';
            complaint.assignedToRole     = 'teacher';
            // Reset visibility to filer + teacher
            complaint.visibleToRoles = [complaint.role, 'teacher', 'admin'].filter(
                (r, i, arr) => arr.indexOf(r) === i
            );
        }

        else {
            return res.status(400).json({ message: 'Invalid status transition', success: false });
        }

        await complaint.save();
        res.status(200).json({ message: 'Complaint status updated', success: true, complaint });
    } catch (err) {
        console.error('updateComplaintStatus error:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND CLEANUP  (called from index.js after DB connects)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every 30 s:
 *   1. Find rejected complaints whose 1-min teacher override window has expired.
 *      → Transfer visibility to the original filer + set autoDeleteAt (now + 10 min).
 *
 * Every 60 s:
 *   2. Hard-delete complaints whose autoDeleteAt has passed.
 */
const startCleanupWorkers = () => {
    // Worker 1: override window expired → make visible to filer
    setInterval(async () => {
        try {
            const expired = await ComplaintModel.find({
                status:              'rejected',
                decisionExpiresAt:   { $lte: new Date() },
                autoDeleteAt:        null,   // not yet transferred
            });

            for (const c of expired) {
                c.visibleToRoles    = [c.role, 'admin'];
                c.decisionExpiresAt = null;
                c.autoDeleteAt      = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
                await c.save();
            }

            if (expired.length > 0) {
                console.log(`[cleanup] Transferred ${expired.length} rejected complaint(s) to filer visibility.`);
            }
        } catch (err) {
            console.error('[cleanup] Override-window worker error:', err.message);
        }
    }, 30 * 1000);

    // Worker 2: autoDeleteAt expired → hard delete
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
