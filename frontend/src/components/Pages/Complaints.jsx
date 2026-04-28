import React, { useEffect, useState, useCallback } from 'react';
import { handleError, handleSuccess } from '../../util';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FILER_ROLES    = new Set(['student', 'classRepresentative', 'labAssistant']);
const VIEW_ONLY_ROLES = new Set(['warden', 'chiefWarden', 'director', 'admin']);
const POLL_INTERVAL  = 30_000;
const api = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS PER ROLE
//
// Hostel flow:   supervisor approves/rejects  →  technician resolves  →  student verifies/reopens
// Academic flow: teacher approves/rejects     →  technician resolves  →  CR/labAssistant verifies/reopens
// ─────────────────────────────────────────────────────────────────────────────

const getActions = (userRole, complaint, currentUserId) => {
    if (VIEW_ONLY_ROLES.has(userRole)) return [];

    const { status, complaintType, userId: filerId } = complaint;

    switch (userRole) {
        // ── SUPERVISOR: approves/rejects Hostel complaints ────────────────
        case 'supervisor':
            if ((complaintType === 'Hostel' || complaintType === 'Other') &&
                ['pending', 'reopened'].includes(status)) {
                return [
                    { label: '✓ Approve',  status: 'in-progress', style: 'approve' },
                    { label: '✗ Reject',   status: 'rejected',    style: 'reject'  },
                ];
            }
            return [];

        // ── TEACHER: approves/rejects Academic complaints ─────────────────
        case 'teacher':
            if (complaintType === 'Academic' && ['pending', 'reopened'].includes(status)) {
                return [
                    { label: '✓ Approve',  status: 'in-progress', style: 'approve' },
                    { label: '✗ Reject',   status: 'rejected',    style: 'reject'  },
                ];
            }
            return [];

        // ── TECHNICIAN: marks resolved ────────────────────────────────────
        case 'technician':
            if (status === 'in-progress') {
                return [{ label: '✓ Mark as Resolved', status: 'resolved', style: 'approve' }];
            }
            return [];

        // ── FILER ROLES: verify or reopen their own resolved complaint ────
        case 'student':
        case 'classRepresentative':
        case 'labAssistant':
            if (status === 'resolved' && filerId === currentUserId) {
                return [
                    { label: '✓ Yes, It\'s Resolved', status: 'verified', style: 'approve' },
                    { label: '✗ Not Resolved Yet',    status: 'reopened', style: 'reject'  },
                ];
            }
            return [];

        default:
            return [];
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS META
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
    pending:       { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    'in-progress': { label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    resolved:      { label: 'Resolved',    color: 'bg-green-100 text-green-700 border-green-200'    },
    verified:      { label: 'Verified ✓',  color: 'bg-teal-100 text-teal-700 border-teal-200'       },
    reopened:      { label: 'Reopened',    color: 'bg-amber-100 text-amber-700 border-amber-200'    },
    rejected:      { label: 'Rejected',    color: 'bg-red-100 text-red-700 border-red-200'          },
};

const TYPE_COLOR = {
    Academic: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    Hostel:   'bg-teal-50 text-teal-600 border-teal-200',
    Other:    'bg-orange-50 text-orange-600 border-orange-200',
};

const ACTION_STYLES = {
    approve: 'bg-green-500 hover:bg-green-600 text-white',
    reject:  'bg-red-100 hover:bg-red-200 text-red-600 border border-red-200',
};

// Clean action labels (remove tick/cross symbols from button text)
const cleanLabel = (label) => label.replace(/^[✓✗]\s*/, '');

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? STATUS_META.pending;
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
            {meta.label}
        </span>
    );
}

function ComplaintCard({ complaint, userRole, onStatusChange }) {
    const [updating, setUpdating] = useState(false);
    const currentUserId = localStorage.getItem('userId');
    const actions = getActions(userRole, complaint, currentUserId);
    const typeColor = TYPE_COLOR[complaint.complaintType] ?? TYPE_COLOR.Other;

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
                handleSuccess('Status updated successfully');
                onStatusChange(complaint._id, data.complaint);
            } else {
                handleError(data.message);
            }
        } catch {
            handleError('Failed to update status. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-orange-200 hover:shadow-sm transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-800 text-sm leading-snug">{complaint.subject}</p>
                        {complaint.complaintType && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>
                                {complaint.complaintType}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        By <span className="text-gray-600 font-medium">{complaint.userName}</span>
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
            <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5">{complaint.description}</p>

            {/* Rejection message */}
            {complaint.rejectionMessage && complaint.status === 'rejected' && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {complaint.rejectionMessage}
                </p>
            )}

            {/* Resolved waiting notice */}
            {complaint.status === 'resolved' && complaint.userId !== currentUserId && FILER_ROLES.has(userRole) && (
                <p className="text-xs text-gray-400 italic">
                    Waiting for the complaint filer to verify resolution.
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-gray-100">
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
                                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50 ${ACTION_STYLES[action.style]}`}
                            >
                                {updating ? '…' : cleanLabel(action.label)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FlatSection({ title, complaints, userRole, onStatusChange, emptyText }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
            {complaints.length === 0 ? (
                <p className="text-center py-10 text-gray-300 text-sm">{emptyText}</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {complaints.map((c) => (
                        <ComplaintCard key={c._id} complaint={c} userRole={userRole} onStatusChange={onStatusChange} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CollapsibleSection({ title, count, accentColor = 'text-orange-500', complaints, userRole, onStatusChange, emptyText, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
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
                <span className={`text-gray-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {open && (
                <div className="p-4">
                    {complaints.length === 0 ? (
                        <p className="text-center py-8 text-gray-300 text-sm">{emptyText}</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {complaints.map((c) => (
                                <ComplaintCard key={c._id} complaint={c} userRole={userRole} onStatusChange={onStatusChange} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPLAINTS PAGE
// ─────────────────────────────────────────────────────────────────────────────

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

    // ── Fetch ────────────────────────────────────────────────────────────────

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
            if (!quiet) handleError('Could not load complaints.');
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

    // ── Optimistic update ────────────────────────────────────────────────────

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

    // ── Form ─────────────────────────────────────────────────────────────────

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userRole === 'labAssistant') {
            if (!form.subject || !form.description || !form.department)
                return handleError('Department, subject and description are required.');
        } else {
            if (!form.subject || !form.description || !form.complaintType)
                return handleError('Complaint type, subject and description are required.');
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
            handleError('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Derived lists ────────────────────────────────────────────────────────

    const pendingComplaints    = active.filter(c => ['pending', 'reopened'].includes(c.status));
    const inProgressComplaints = active.filter(c => c.status === 'in-progress');
    const rejectedComplaints   = active.filter(c => c.status === 'rejected');

    // ── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto space-y-8">

            {/* Page header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Submit and track complaints through the institutional hierarchy.
                    </p>
                </div>
                <button
                    onClick={() => fetchComplaints()}
                    className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors pb-1"
                >
                    Refresh
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
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department *</label>
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
                                        {/* student can file Hostel or Other; CR files Academic */}
                                        {userRole === 'student' && (
                                            <>
                                                <option value="Hostel">Hostel</option>
                                                <option value="Other">Other</option>
                                            </>
                                        )}
                                        {userRole === 'classRepresentative' && (
                                            <option value="Academic">Academic</option>
                                        )}
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
                                            Hostel Block <span className="text-gray-300 normal-case font-normal">(optional)</span>
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

                    {/* ── FILER VIEW (student / CR / labAssistant) ── */}
                    {FILER_ROLES.has(userRole) && (
                        <>
                            <FlatSection
                                title="My Active Complaints"
                                complaints={active}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="You have no active complaints."
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

                    {/* ── SUPERVISOR VIEW ── */}
                    {userRole === 'supervisor' && (
                        <>
                            <FlatSection
                                title="Pending Hostel Complaints"
                                complaints={pendingComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints pending your approval."
                            />
                            <CollapsibleSection
                                title="In-Progress (Assigned to Technician)"
                                count={inProgressComplaints.length}
                                accentColor="text-purple-500"
                                complaints={inProgressComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints in progress."
                            />
                            <CollapsibleSection
                                title="Resolved / Closed"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints yet."
                            />
                        </>
                    )}

                    {/* ── TEACHER VIEW ── */}
                    {userRole === 'teacher' && (
                        <>
                            <FlatSection
                                title="Pending Academic Complaints"
                                complaints={pendingComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints pending your approval."
                            />
                            <CollapsibleSection
                                title="In-Progress (Assigned to Technician)"
                                count={inProgressComplaints.length}
                                accentColor="text-purple-500"
                                complaints={inProgressComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints in progress."
                            />
                            <CollapsibleSection
                                title="Resolved / Closed"
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
                                title="Assigned Complaints (In-Progress)"
                                complaints={inProgressComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints assigned to you."
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

                    {/* ── VIEW-ONLY ROLES (warden / chiefWarden / director / admin) ── */}
                    {VIEW_ONLY_ROLES.has(userRole) && (
                        <>
                            <FlatSection
                                title="Pending Complaints"
                                complaints={pendingComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No pending complaints."
                            />
                            <CollapsibleSection
                                title="In-Progress"
                                count={inProgressComplaints.length}
                                accentColor="text-purple-500"
                                complaints={inProgressComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No complaints in progress."
                            />
                            <CollapsibleSection
                                title="Rejected Complaints"
                                count={rejectedComplaints.length}
                                accentColor="text-red-500"
                                complaints={rejectedComplaints}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No rejected complaints."
                            />
                            <CollapsibleSection
                                title="Resolved / Verified"
                                count={resolved.length}
                                accentColor="text-green-500"
                                complaints={resolved}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                emptyText="No resolved complaints."
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Complaints;
