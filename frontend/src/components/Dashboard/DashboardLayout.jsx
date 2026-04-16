import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavigation from './DashboardNavigation';

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardNavigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
