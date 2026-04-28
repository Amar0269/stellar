import React, { useEffect, useState } from 'react';
import { handleError, handleSuccess } from '../../util';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function UserRow({ user, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);

  const act = async (action) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const res = await fetch(`${API}/api/admin/${endpoint}/${user._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        handleSuccess(data.message);
        action === 'approve' ? onApprove(user._id) : onReject(user._id);
      } else {
        handleError(data.message);
      }
    } catch {
      handleError('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 rounded-2xl bg-white border border-gray-200 hover:border-orange-200 hover:shadow-sm transition-all duration-200">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-500 border border-orange-200 whitespace-nowrap shrink-0">
        {user.role.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          disabled={loading}
          onClick={() => act('approve')}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-150 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => act('reject')}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors duration-150 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function AdminPanel() {
  const role = localStorage.getItem('role');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') return;
    fetchPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
      else handleError(data.message);
    } catch {
      handleError('Could not fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-gray-400 text-sm">
        Access denied. Admin only.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review and approve pending user registrations.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="text-2xl font-black text-orange-500 leading-none">{users.length}</p>
        </div>
      </div>

      {/* Section heading + refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pending Users</h2>
        <button
          onClick={fetchPending}
          className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm font-semibold">All caught up</p>
          <p className="text-gray-400 text-xs mt-1">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              onApprove={(id) => setUsers((prev) => prev.filter((x) => x._id !== id))}
              onReject={(id) => setUsers((prev) => prev.filter((x) => x._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
