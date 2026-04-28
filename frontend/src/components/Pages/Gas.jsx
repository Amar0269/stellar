import React from 'react';
import { dbMain } from '../../firebaseMain';
import useRoomsData from '../../hooks/useRoomsData';
import RoomGrid from '../Dashboard/RoomGrid';

function Gas() {
  const { rooms, error } = useRoomsData(dbMain);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Live Feed</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Gas Detection</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gas concentration monitoring per room. Values above 3000 trigger an alert.
        </p>
      </div>

      <RoomGrid rooms={rooms} sensor="gas" gasMode error={error} />
    </div>
  );
}

export default Gas;
