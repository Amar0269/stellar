import React, { useEffect, useState } from 'react';
import SensorCard from '../Dashboard/SensorCard';

function Gas() {
  const [gasLevel, setGasLevel] = useState(null);

  useEffect(() => {
    // TODO: Fetch gas level from MongoDB/ESP32 backend
    // Example:
    // const res = await fetch('/api/sensors/gas');
    // const json = await res.json();
    // setGasLevel(json.latest);
  }, []);

  const getStatus = (val) => {
    if (val === null) return { label: 'No Data', color: 'bg-gray-100 text-gray-400' };
    if (val > 500)    return { label: 'Danger',  color: 'bg-red-100 text-red-500' };
    if (val > 200)    return { label: 'Warning', color: 'bg-yellow-100 text-yellow-600' };
    return                { label: 'Safe',    color: 'bg-green-100 text-green-600' };
  };

  const { label, color } = getStatus(gasLevel);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">💨 Gas Level</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time air quality and gas concentration readings.</p>
      </div>

      <SensorCard
        title="Current Gas Level"
        icon="💨"
        value={gasLevel}
        unit="ppm"
        status={label}
        statusColor={color}
        description="Readings above 500 ppm indicate dangerous concentrations."
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

export default Gas;
