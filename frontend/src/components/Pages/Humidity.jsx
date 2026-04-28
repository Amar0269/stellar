import React from 'react';
import { dbMain } from '../../firebaseMain';
import useRoomsData from '../../hooks/useRoomsData';
import RoomGrid from '../Dashboard/RoomGrid';

function Humidity() {
  const { rooms, error } = useRoomsData(dbMain);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Live Feed</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Humidity</h1>
        <p className="text-sm text-gray-400 mt-1">
          Relative humidity readings from all campus rooms. Updates in real time.
        </p>
      </div>

      <RoomGrid rooms={rooms} sensor="humidity" unit="%" error={error} />
    </div>
  );
}

export default Humidity;
