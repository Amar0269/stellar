import React, { useEffect, useState } from 'react';
import { handleError, handleSuccess } from '../../util';

const API = 'http://localhost:8080';

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
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-150">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200 whitespace-nowrap shrink-0">
        {user.role.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          disabled={loading}
          onClick={() => act('approve')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-150 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => act('reject')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 transition-colors duration-150 disabled:opacity-50"
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review and approve pending user registrations.
        </p>
      </div>

      {/* Stats strip */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-orange-700 font-medium">Pending Approvals</span>
        <span className="text-2xl font-bold text-orange-500">{users.length}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">Pending Users</h2>
        <button
          onClick={fetchPending}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          ↻ Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-gray-400 text-sm">No pending approvals. All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
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
