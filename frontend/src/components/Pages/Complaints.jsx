import React, { useEffect, useState, useCallback } from 'react';
import { handleError, handleSuccess } from '../../util';

// ─── Role helpers ─────────────────────────────────────────────────────────────

const VIEW_ONLY_ROLES = new Set(['warden', 'chiefWarden', 'director', 'admin', 'supervisor']);

const getActions = (userRole, complaint) => {
    if (VIEW_ONLY_ROLES.has(userRole)) return [];

    switch (userRole) {
        case 'teacher':
            if (['pending', 'reopened'].includes(complaint.status)) {
                return [
                    { label: '✓ Approve', status: 'in-progress', style: 'approve' },
                    { label: '✗ Reject',  status: 'rejected',    style: 'reject'  },
                ];
            }
            if (complaint.status === 'rejected' && complaint.decisionExpiresAt) {
                const expiresAt = new Date(complaint.decisionExpiresAt);
                if (expiresAt > new Date()) {
                    return [{ label: '↩ Revoke Rejection', status: 'pending', style: 'revoke' }];
                }
            }
            return [];

        case 'technician':
            if (complaint.status === 'in-progress') {
                return [{ label: '✓ Mark Resolved', status: 'resolved', style: 'approve' }];
            }
            return [];

        case 'student':
        case 'labAssistant':
        case 'classRepresentative':
            if (complaint.status === 'resolved') {
                return [
                    { label: '✓ Accept Resolution', status: 'verified', style: 'approve' },
                    { label: '✗ Not Resolved',       status: 'reopened', style: 'reject'  },
                ];
            }
            return [];

        default:
            return [];
    }
};

// ─── Status meta ──────────────────────────────────────────────────────────────

const STATUS_META = {
    pending:       { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    'in-progress': { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    resolved:      { label: 'Resolved',    color: 'bg-green-100 text-green-700 border-green-200'    },
    verified:      { label: 'Verified',    color: 'bg-teal-100 text-teal-700 border-teal-200'       },
    reopened:      { label: 'Reopened',    color: 'bg-amber-100 text-amber-700 border-amber-200'    },
    rejected:      { label: 'Rejected',    color: 'bg-red-100 text-red-700 border-red-200'          },
};

const COMPLAINT_TYPE_COLOR = {
    Academic: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    Hostel:   'bg-teal-50 text-teal-600 border-teal-200',
    Other:    'bg-orange-50 text-orange-600 border-orange-200',
};

const api = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? STATUS_META.pending;
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
            {meta.label}
        </span>
    );
}

const ACTION_STYLES = {
    approve: 'bg-green-500 hover:bg-green-600 text-white',
    reject:  'bg-red-500 hover:bg-red-600 text-white',
    revoke:  'bg-amber-400 hover:bg-amber-500 text-white',
};

function ComplaintCard({ complaint, userRole, onStatusChange }) {
    const [updating, setUpdating] = useState(false);
    const actions   = getActions(userRole, complaint);
    const typeColor = COMPLAINT_TYPE_COLOR[complaint.complaintType] ?? COMPLAINT_TYPE_COLOR.Other;

    const handleAction = async (newStatus) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${api}/api/complaint/${complaint._id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                handleSuccess('Status updated');
                onStatusChange(complaint._id, data.complaint);
            } else {
                handleError(data.message);
            }
        } catch {
            handleError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-800 text-sm">{complaint.subject}</p>
                        {complaint.complaintType && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${typeColor}`}>
                                {complaint.complaintType}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        By <span className="text-gray-600">{complaint.userName}</span>
                        &nbsp;·&nbsp;
                        <span className="capitalize">{complaint.role.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {complaint.department  && <>&nbsp;·&nbsp;<span className="text-gray-500">{complaint.department}</span></>}
                        {complaint.roomNumber  && <>&nbsp;·&nbsp;Room {complaint.roomNumber}</>}
                        {complaint.hostelNumber && <>&nbsp;·&nbsp;Hostel {complaint.hostelNumber}</>}
                    </p>
                </div>
                <StatusBadge status={complaint.status} />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed">{complaint.description}</p>

            {/* Rejection message */}
            {complaint.rejectionMessage && complaint.status === 'rejected' && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    ⚠ {complaint.rejectionMessage}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-gray-50">
                <span className="text-xs text-gray-300">
                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
                {actions.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {actions.map((action) => (
                            <button
                                key={action.status}
                                disabled={updating}
                                onClick={() => handleAction(action.status)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 ${ACTION_STYLES[action.style]}`}
                            >
                                {updating ? '…' : action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Collapsible dropdown section ─────────────────────────────────────────────

function CollapsibleSection({ title, count, accentColor = 'text-orange-500', complaints, userRole, onStatusChange, emptyText, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Header / toggle */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">{title}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${accentColor} border-current`}>
                        {count}
                    </span>
                </div>
                <span className={`text-gray-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    ▾
                </span>
            </button>

            {/* Body */}
            {open && (
                <div className="p-4">
                    {complaints.length === 0 ? (
                        <p className="text-center py-8 text-gray-300 text-sm">{emptyText}</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {complaints.map((c) => (
                                <ComplaintCard
                                    key={c._id}
                                    complaint={c}
                                    userRole={userRole}
                                    onStatusChange={onStatusChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Flat section (active complaints — always visible) ────────────────────────

function FlatSection({ title, complaints, userRole, onStatusChange, emptyText }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
            {complaints.length === 0 ? (
                <p className="text-center py-10 text-gray-300 text-sm">{emptyText}</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {complaints.map((c) => (
                        <ComplaintCard
                            key={c._id}
                            complaint={c}
                            userRole={userRole}
                            onStatusChange={onStatusChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Complaints page ──────────────────────────────────────────────────────

const FILER_ROLES   = new Set(['student', 'classRepresentative', 'labAssistant']);
const POLL_INTERVAL = 30_000;

function Complaints() {
    const [userRole,   setUserRole]   = useState('');
    const [active,     setActive]     = useState([]);
    const [resolved,   setResolved]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        subject: '', description: '', roomNumber: '',
        hostelNumber: '', complaintType: '', department: '',
    });

    // ── Fetch ──────────────────────────────────────────────────────

    const fetchComplaints = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res   = await fetch(`${api}/api/complaint`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setActive(data.active   ?? []);
                setResolved(data.resolved ?? []);
            }
        } catch {
            if (!quiet) handleError('Could not load complaints');
        } finally {
            if (!quiet) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const role = localStorage.getItem('role') || 'student';
        setUserRole(role);
        fetchComplaints();
        const interval = setInterval(() => fetchComplaints(true), POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchComplaints]);

    // ── Optimistic update ─────────────────────────────────────────

    const handleStatusChange = useCallback((id, updatedComplaint) => {
        const RESOLVED_STATUSES = new Set(['resolved', 'verified']);
        const isNowResolved = RESOLVED_STATUSES.has(updatedComplaint.status);
        setActive(prev   => prev.filter(c => c._id !== id));
        setResolved(prev => prev.filter(c => c._id !== id));
        if (isNowResolved) {
            setResolved(prev => [updatedComplaint, ...prev]);
        } else {
            setActive(prev => [updatedComplaint, ...prev]);
        }
    }, []);

    // ── Form ──────────────────────────────────────────────────────

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userRole === 'labAssistant') {
            if (!form.subject || !form.description || !form.department)
                return handleError('Department, subject and description are required');
        } else {
            if (!form.subject || !form.description || !form.complaintType)
                return handleError('Complaint type, subject and description are required');
        }

        const payload = userRole === 'labAssistant'
            ? { subject: form.subject, description: form.description, department: form.department, complaintType: 'Academic' }
            : form;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res   = await fetch(`${api}/api/complaint`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                handleSuccess('Complaint submitted!');
                setForm({ subject: '', description: '', roomNumber: '', hostelNumber: '', complaintType: '', department: '' });
                fetchComplaints();
            } else {
                handleError(data.message);
            }
        } catch {
            handleError('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Derived lists for dropdowns ───────────────────────────────

    // "Approved" for teacher = complaints they approved (now in-progress)
    const approvedByTeacher = active.filter(c => c.status === 'in-progress');

    // Truly active (needs action) for teacher = pending / reopened / rejected
    const pendingForTeacher = active.filter(c => ['pending', 'reopened', 'rejected'].includes(c.status));

    // For view-only roles: "approved" = in-progress + resolved + verified (all forwarded complaints)
    const approvedForViewOnly = [
        ...active.filter(c => c.status === 'in-progress'),
        ...resolved,
    ];

    // ─────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto space-y-8">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Submit and track complaints through the institutional hierarchy.
                    </p>
                </div>
                <button
                    onClick={() => fetchComplaints()}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* ── Create Complaint Form (filer roles only) ── */}
            {FILER_ROLES.has(userRole) && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-700 mb-4">Submit a New Complaint</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {userRole === 'labAssistant' ? (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Complaint Type</label>
                                    <div className="mt-1 px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
                                        Academic
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department Name *</label>
                                    <input
                                        type="text" name="department" required
                                        value={form.department} onChange={handleChange}
                                        placeholder="e.g. Computer Science"
                                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Complaint Type *</label>
                                    <select
                                        name="complaintType" required
                                        value={form.complaintType} onChange={handleChange}
                                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Academic">Academic</option>
                                        <option value="Hostel">Hostel</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Room Number <span className="text-gray-300 normal-case font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text" name="roomNumber"
                                            value={form.roomNumber} onChange={handleChange}
                                            placeholder="e.g. 204"
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Hostel Number <span className="text-gray-300 normal-case font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text" name="hostelNumber"
                                            value={form.hostelNumber} onChange={handleChange}
                                            placeholder="e.g. B-Block"
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject *</label>
                            <input
                                type="text" name="subject" required
                                value={form.subject} onChange={handleChange}
                                placeholder="Brief title of your complaint"
                                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description *</label>
                            <textarea
                                name="description" required rows={4}
                                value={form.description} onChange={handleChange}
                                placeholder="Describe the issue in detail..."
                                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                            />
                        </div>

                        <button
                            type="submit" disabled={submitting}
                            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60"
                        >
                            {submitting ? 'Submitting…' : 'Submit Complaint'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Loading ── */}
            {loading ? (
                <div className="text-center py-12 text-gray-300 text-sm">Loading…</div>
            ) : (
                <div className="space-y-6">

                    {/* ── TEACHER VIEW ── */}
                    {userRole === 'teacher' && (
                        <>
                            <FlatSection
                                title="Complaints Awaiting Your Decision"
                                complaints={pendingForTeacher}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints pending your review."
                            />
                            <CollapsibleSection
                                title="Approved by You (In-Progress)"
                                count={approvedByTeacher.length}
                                accentColor="text-purple-500"
                                complaints={approvedByTeacher}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="You haven't approved any complaints yet."
                            />
                            <CollapsibleSection
                                title="Resolved Complaints"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints yet."
                            />
                        </>
                    )}

                    {/* ── TECHNICIAN VIEW ── */}
                    {userRole === 'technician' && (
                        <>
                            <FlatSection
                                title="Active Complaints"
                                complaints={active}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No active complaints assigned."
                            />
                            <CollapsibleSection
                                title="Resolved Complaints"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints yet."
                            />
                        </>
                    )}

                    {/* ── FILER ROLES (student / CR / labAssistant) ── */}
                    {FILER_ROLES.has(userRole) && (
                        <>
                            <FlatSection
                                title="My Active Complaints"
                                complaints={active}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No active complaints."
                            />
                            <CollapsibleSection
                                title="Resolved / Verified Complaints"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints yet."
                            />
                        </>
                    )}

                    {/* ── VIEW-ONLY ROLES (supervisor / warden / chiefWarden / director / admin) ── */}
                    {VIEW_ONLY_ROLES.has(userRole) && (
                        <>
                            <FlatSection
                                title="Pending Complaints"
                                complaints={active.filter(c => ['pending', 'reopened', 'rejected'].includes(c.status))}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No pending complaints."
                            />
                            <CollapsibleSection
                                title="Approved & In-Progress"
                                count={active.filter(c => c.status === 'in-progress').length}
                                accentColor="text-purple-500"
                                complaints={active.filter(c => c.status === 'in-progress')}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints in progress."
                            />
                            <CollapsibleSection
                                title="Resolved / Verified Complaints"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints yet."
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Complaints;
