import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sensorCards = [
  {
    id: 'temperature',
    label: 'Temperature',
    description: 'Ambient temperature across all rooms.',
    unit: '°C',
    path: '/dashboard/temperature',
  },
  {
    id: 'gas',
    label: 'Gas',
    description: 'Gas concentration levels per room.',
    unit: 'ppm',
    path: '/dashboard/gas',
  },
  {
    id: 'humidity',
    label: 'Humidity',
    description: 'Relative humidity readings per room.',
    unit: '%',
    path: '/dashboard/humidity',
  },
  {
    id: 'dustbin',
    label: 'Dustbin',
    description: 'Bin fill percentage across all rooms.',
    unit: '%',
    path: '/dashboard/dustbin',
  },
];

function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedInUser(localStorage.getItem('loggedInUser'));
    setRole(localStorage.getItem('role') || 'student');
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome */}
      <div className="mb-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, <span className="text-orange-500">{loggedInUser || '...'}</span>
          </h1>
          {role && (
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
              {role.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Stellar is a real-time IoT dashboard. Select a sensor module below to monitor live data from your ESP32 devices.
        </p>
      </div>

      {/* Sensor overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sensorCards.map(({ id, label, description, unit, path }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-2 text-left hover:border-orange-200 hover:shadow-md transition-all duration-150 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors duration-150">
                {label}
              </span>
              <span className="text-xs text-gray-300 font-medium">{unit}</span>
            </div>
            <p className="text-xs text-gray-400">{description}</p>
            <div className="h-0.5 w-8 bg-orange-400 rounded-full mt-1 group-hover:w-full transition-all duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;