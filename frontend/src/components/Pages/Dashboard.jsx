import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  temperature: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V8.5a3 3 0 016 0V19M9 19a3 3 0 006 0M9 19H6.5M15 19h2.5" />
    </svg>
  ),
  gas: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  humidity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s-7 7.5-7 12a7 7 0 0014 0c0-4.5-7-12-7-12z" />
    </svg>
  ),
  dustbin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M10 3h4a1 1 0 011 1v3H9V4a1 1 0 011-1z" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 1118 0" />
    </svg>
  ),
  results: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// ── Data ──────────────────────────────────────────────────────────────────────
const iotCards = [
  { id: 'temperature', label: 'Temperature', description: 'Ambient temperature across all campus rooms.', unit: '°C', path: '/dashboard/temperature' },
  { id: 'gas',         label: 'Gas Detection', description: 'Gas concentration monitoring per room.',         unit: '',   path: '/dashboard/gas' },
  { id: 'humidity',    label: 'Humidity',       description: 'Relative humidity readings per room.',           unit: '%',  path: '/dashboard/humidity' },
  { id: 'dustbin',     label: 'Dustbin',         description: 'Bin fill level across all campus rooms.',        unit: '%',  path: '/dashboard/dustbin' },
];

const featureCards = [
  { id: 'attendance', label: 'Face Recognition Attendance', description: 'Automated attendance tracking using facial recognition technology.' },
  { id: 'results',    label: 'Online Result Viewing',        description: 'Students can view and download their academic results online.' },
];

// ── IoT Sensor Card ───────────────────────────────────────────────────────────
function SensorCard({ id, label, description, unit, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 text-left w-full hover:border-orange-300 hover:shadow-md transition-all duration-200"
    >
      {/* Top row: icon + unit */}
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-200">
          {Icons[id]}
        </div>
        {unit && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
            {unit}
          </span>
        )}
      </div>

      {/* Label + description */}
      <div>
        <p className="text-sm font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>

      {/* Footer: arrow */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs font-medium text-orange-500">View rooms</span>
        <span className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all duration-200">
          {Icons.arrow}
        </span>
      </div>
    </button>
  );
}

// ── Feature Placeholder Card ──────────────────────────────────────────────────
function FeatureCard({ id, label, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 cursor-default">
      {/* Top row: icon + badge */}
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
          {Icons[id]}
        </div>
        <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
          Coming Soon
        </span>
      </div>

      {/* Label + description */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>

      {/* Footer placeholder */}
      <div className="pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-300">Not yet available</span>
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedInUser(localStorage.getItem('loggedInUser'));
    setRole(localStorage.getItem('role') || 'student');
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* ── Welcome ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-orange-500">{loggedInUser || '...'}</span>
          </h1>
          {role && (
            <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-orange-50 text-orange-500 border border-orange-200">
              {role.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1.5">
          Here is an overview of all Stellar campus systems.
        </p>
      </div>

      {/* ── IoT Monitoring ───────────────────────────────── */}
      <div>
        <SectionHeading
          title="IoT Monitoring"
          subtitle="Live data from ESP32 sensors across campus rooms."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {iotCards.map((card) => (
            <SensorCard key={card.id} {...card} onClick={() => navigate(card.path)} />
          ))}
        </div>
      </div>

      {/* ── Campus Features ──────────────────────────────── */}
      <div>
        <SectionHeading
          title="Campus Features"
          subtitle="Upcoming services integrated into the Stellar platform."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featureCards.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;