import React from 'react';
import useSensorData from '../../hooks/useSensorData';
import RoomGrid from '../Dashboard/RoomGrid';

function Humidity() {
  const { rooms, error } = useSensorData('humidity');

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Humidity</h2>
        <p className="text-sm text-gray-400 mt-1">
          Live relative humidity per room — updates automatically.
        </p>
      </div>
      <RoomGrid rooms={rooms} error={error} unit="%" />
    </div>
  );
}

export default Humidity;
