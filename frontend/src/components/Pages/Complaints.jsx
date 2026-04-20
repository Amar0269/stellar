import React, { useEffect, useState } from 'react';
import { handleError, handleSuccess } from '../../util';

const ROLES_ORDERED = [
  'student', 'classRepresentative', 'labAssistant', 'technician',
  'teacher', 'supervisor', 'warden', 'chiefWarden', 'director', 'admin',
];
const ROLE_RANK = Object.fromEntries(ROLES_ORDERED.map((r, i) => [r, i]));

const STATUS_META = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved:    { label: 'Approved',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'in-progress':{ label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-700 border-green-200' },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const STATUS_OPTIONS = ['pending', 'approved', 'in-progress', 'resolved', 'closed'];

const API = 'http://localhost:8080';

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function ComplaintCard({ complaint, userRole, onStatusChange }) {
  const canUpdate =
    userRole === 'admin' ||
    (complaint.visibleToRoles?.includes(userRole) &&
      ROLE_RANK[userRole] > ROLE_RANK[complaint.role]);

  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/complaint/${complaint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        handleSuccess('Status updated');
        onStatusChange(complaint._id, newStatus);
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
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{complaint.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            By <span className="text-gray-600">{complaint.userName}</span>
            &nbsp;·&nbsp;
            <span className="capitalize">{complaint.role.replace(/([A-Z])/g, ' $1').trim()}</span>
            {complaint.roomNumber && <>&nbsp;·&nbsp;Room {complaint.roomNumber}</>}
            {complaint.hostelNumber && <>&nbsp;·&nbsp;Hostel {complaint.hostelNumber}</>}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{complaint.description}</p>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-300">
          {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>

        {canUpdate && (
          <select
            disabled={updating}
            value={complaint.status}
            onChange={(e) => handleUpdate(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function Complaints() {
  const [userRole, setUserRole] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    description: '',
    roomNumber: '',
    hostelNumber: '',
  });

  useEffect(() => {
    const role = localStorage.getItem('role') || 'student';
    setUserRole(role);
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/complaint`, {
        headers: { Authorization: token },
      });
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch {
      handleError('Could not load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) {
      return handleError('Subject and description are required');
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        handleSuccess('Complaint submitted!');
        setForm({ subject: '', description: '', roomNumber: '', hostelNumber: '' });
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

  const handleStatusChange = (id, newStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
        <p className="text-sm text-gray-400 mt-1">
          Submit and track complaints through the institutional hierarchy.
        </p>
      </div>

      {/* ── Create Complaint Form ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Submit a New Complaint</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Room Number <span className="text-gray-300 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="e.g. 204"
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Hostel Number <span className="text-gray-300 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="hostelNumber"
                value={form.hostelNumber}
                onChange={handleChange}
                placeholder="e.g. B-Block"
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject *</label>
            <input
              type="text"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief title of your complaint"
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      {/* ── Complaint List ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">
            {userRole === 'admin' ? 'All Complaints' : 'Complaints Visible to You'}
          </h2>
          <button
            onClick={fetchComplaints}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-300 text-sm">Loading…</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-sm">No complaints found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.map((c) => (
              <ComplaintCard
                key={c._id}
                complaint={c}
                userRole={userRole}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Complaints;
