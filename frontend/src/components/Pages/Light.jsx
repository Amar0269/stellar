import React, { useEffect, useState } from 'react';
import SensorCard from '../Dashboard/SensorCard';

function Light() {
  const [lightStatus, setLightStatus] = useState(null);

  useEffect(() => {
    // TODO: Fetch light level from MongoDB/ESP32 backend
    // Example:
    // const res = await fetch('/api/sensors/light');
    // const json = await res.json();
    // setLightStatus(json.latest);
  }, []);

  const getStatus = (val) => {
    if (val === null) return { label: 'No Data', color: 'bg-gray-100 text-gray-400' };
    if (val > 1000)   return { label: 'Bright',  color: 'bg-yellow-100 text-yellow-600' };
    if (val > 300)    return { label: 'Moderate', color: 'bg-orange-100 text-orange-500' };
    return                { label: 'Dim',     color: 'bg-gray-100 text-gray-500' };
  };

  const { label, color } = getStatus(lightStatus);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">💡 Light</h2>
        <p className="text-sm text-gray-400 mt-1">Ambient light intensity from the LDR sensor.</p>
      </div>

      <SensorCard
        title="Current Light Level"
        icon="💡"
        value={lightStatus}
        unit="lux"
        status={label}
        statusColor={color}
        description="Values above 1000 lux indicate direct sunlight exposure."
      />

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Historical Data</h3>
        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
          Chart will appear here once data is available.
        </div>
      </div>
    </div>
  );
}

export default Light;
