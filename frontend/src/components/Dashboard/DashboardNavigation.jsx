import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../util';

// ── Inline SVG icons (no extra library needed) ───────────────────────────────
const Icons = {
  Overview: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Temperature: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V7a3 3 0 016 0v12M9 19a3 3 0 006 0M9 19H6m9 0h3" />
    </svg>
  ),
  Gas: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  Humidity: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C12 3 5 10.5 5 15a7 7 0 0014 0c0-4.5-7-12-7-12z" />
    </svg>
  ),
  Dustbin: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Complaints: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  AdminPanel: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Chevron: ({ flipped }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-4 h-4 transition-transform duration-300 ${flipped ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
};

const baseNavItems = [
  { label: 'Overview',    path: '/dashboard',             icon: Icons.Overview },
  { label: 'Temperature', path: '/dashboard/temperature', icon: Icons.Temperature },
  { label: 'Gas',         path: '/dashboard/gas',         icon: Icons.Gas },
  { label: 'Humidity',    path: '/dashboard/humidity',    icon: Icons.Humidity },
  { label: 'Dustbin',     path: '/dashboard/dustbin',     icon: Icons.Dustbin },
  { label: 'Complaints',  path: '/dashboard/complaints',  icon: Icons.Complaints },
];

function DashboardNavigation({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';

  const navItems = role === 'admin'
    ? [...baseNavItems, { label: 'Admin Panel', path: '/dashboard/admin', icon: Icons.AdminPanel }]
    : baseNavItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('role');
    handleSuccess('Logged out successfully');
    setTimeout(() => navigate('/'), 1000);
  };

  return (
    <aside
      className={`
        min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 shadow-sm shrink-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16 px-2' : 'w-56 px-4'}
      `}
    >
      {/* ── Brand + toggle ─────────────────── */}
      <div className={`flex items-center mb-8 ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
        {!collapsed && (
          <div>
            <span className="text-lg font-bold text-orange-500 tracking-tight">Stellar</span>
            <p className="text-xs text-gray-400 mt-0.5">Campus Platform</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icons.Chevron flipped={!collapsed} />
        </button>
      </div>

      {/* ── Nav items ──────────────────────── */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150
              ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
              ${isActive
                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {icon}
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── Logout ─────────────────────────── */}
      <button
        onClick={handleLogout}
        title={collapsed ? 'Logout' : undefined}
        className={`
          mt-6 flex items-center gap-2 rounded-lg text-sm font-semibold text-white
          bg-orange-500 hover:bg-orange-600 active:bg-orange-700
          transition-all duration-150
          ${collapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2.5'}
        `}
      >
        {Icons.Logout}
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

export default DashboardNavigation;
