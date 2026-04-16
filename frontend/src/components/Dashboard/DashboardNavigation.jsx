import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../util';

const navItems = [
  { label: 'Overview',     path: '/dashboard',             icon: '⊞' },
  { label: 'Temperature',  path: '/dashboard/temperature', icon: '🌡' },
  { label: 'Gas',          path: '/dashboard/gas',         icon: '💨' },
  { label: 'Light',        path: '/dashboard/light',       icon: '💡' },
  { label: 'Garbage',      path: '/dashboard/garbage',     icon: '🗑' },
];

function DashboardNavigation() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('Logged out successfully');
    setTimeout(() => navigate('/'), 1000);
  };

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col py-8 px-4 shadow-sm shrink-0">
      <div className="mb-10 px-2">
        <span className="text-2xl font-bold text-orange-500 tracking-tight">⚡ Stellar</span>
        <p className="text-xs text-gray-400 mt-1">IoT Dashboard</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
      >
        <span>↩</span> Logout
      </button>
    </aside>
  );
}

export default DashboardNavigation;
