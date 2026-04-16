import React from 'react';

function SensorCard({ title, icon, value, unit, status, statusColor, description }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">
            {icon}
          </div>
          <span className="text-sm font-semibold text-gray-500">{title}</span>
        </div>
        {status && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {status}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        {value !== null && value !== undefined ? (
          <>
            <span className="text-4xl font-bold text-gray-800">{value}</span>
            {unit && <span className="text-lg text-gray-400 mb-1">{unit}</span>}
          </>
        ) : (
          <span className="text-2xl font-semibold text-gray-300">—</span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
}

export default SensorCard;
