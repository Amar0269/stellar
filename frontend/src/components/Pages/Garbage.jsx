import React, { useEffect, useState } from 'react';
import SensorCard from '../Dashboard/SensorCard';

function Garbage() {
  const [garbageLevel, setGarbageLevel] = useState(null);

  useEffect(() => {
    // TODO: Fetch garbage fill level from MongoDB/ESP32 backend
    // Example:
    // const res = await fetch('/api/sensors/garbage');
    // const json = await res.json();
    // setGarbageLevel(json.latest);
  }, []);

  const getStatus = (val) => {
    if (val === null) return { label: 'No Data', color: 'bg-gray-100 text-gray-400' };
    if (val >= 90)    return { label: 'Full',    color: 'bg-red-100 text-red-500' };
    if (val >= 60)    return { label: 'High',    color: 'bg-yellow-100 text-yellow-600' };
    return                { label: 'OK',      color: 'bg-green-100 text-green-600' };
  };

  const { label, color } = getStatus(garbageLevel);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">🗑 Garbage</h2>
        <p className="text-sm text-gray-400 mt-1">Ultrasonic bin fill-level monitoring.</p>
      </div>

      <SensorCard
        title="Bin Fill Level"
        icon="🗑"
        value={garbageLevel}
        unit="%"
        status={label}
        statusColor={color}
        description="Bin requires emptying when fill level reaches 90%."
      />

      {garbageLevel !== null && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Fill Level</h3>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-500"
              style={{
                width: `${garbageLevel}%`,
                backgroundColor: garbageLevel >= 90 ? '#ef4444' : garbageLevel >= 60 ? '#f59e0b' : '#f97316',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{garbageLevel}% full</p>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Historical Data</h3>
        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
          Chart will appear here once data is available.
        </div>
      </div>
    </div>
  );
}

export default Garbage;
