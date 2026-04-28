import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavigation from './DashboardNavigation';

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardNavigation
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />
      <main className="flex-1 p-8 overflow-y-auto transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
