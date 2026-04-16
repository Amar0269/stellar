import React, { useEffect, useState } from 'react';
import SensorCard from '../Dashboard/SensorCard';

function Temperature() {
  const [temperatureData, setTemperatureData] = useState(null);

  useEffect(() => {
    // TODO: Fetch temperature history from MongoDB/ESP32 backend
    // Example:
    // const res = await fetch('/api/sensors/temperature');
    // const json = await res.json();
    // setTemperatureData(json.latest);
  }, []);

  const getStatus = (val) => {
    if (val === null) return { label: 'No Data', color: 'bg-gray-100 text-gray-400' };
    if (val > 35)     return { label: 'High',    color: 'bg-red-100 text-red-500' };
    if (val < 18)     return { label: 'Low',     color: 'bg-blue-100 text-blue-500' };
    return               { label: 'Normal',  color: 'bg-green-100 text-green-600' };
  };

  const { label, color } = getStatus(temperatureData);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">🌡 Temperature</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time ambient temperature readings from ESP32.</p>
      </div>

      <SensorCard
        title="Current Temperature"
        icon="🌡"
        value={temperatureData}
        unit="°C"
        status={label}
        statusColor={color}
        description="Sensor updates every 10 seconds via ESP32."
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

export default Temperature;
