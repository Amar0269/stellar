import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../util';

const baseNavItems = [
  { label: 'Overview',    path: '/dashboard' },
  { label: 'Temperature', path: '/dashboard/temperature' },
  { label: 'Gas',         path: '/dashboard/gas' },
  { label: 'Humidity',    path: '/dashboard/humidity' },
  { label: 'Dustbin',     path: '/dashboard/dustbin' },
  { label: 'Complaints',  path: '/dashboard/complaints' },
];

function DashboardNavigation() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';

  // Admin-only items appended to the nav
  const navItems = role === 'admin'
    ? [...baseNavItems, { label: 'Admin Panel', path: '/dashboard/admin' }]
    : baseNavItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('role');
    handleSuccess('Logged out successfully');
    setTimeout(() => navigate('/'), 1000);
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-8 px-4 shadow-sm shrink-0">
      <div className="mb-10 px-2">
        <span className="text-xl font-bold text-orange-500 tracking-tight">Stellar</span>
        <p className="text-xs text-gray-400 mt-1">IoT Dashboard</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${isActive
                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150"
      >
        Logout
      </button>
    </aside>
  );
}

export default DashboardNavigation;
