import React from 'react';
import RoomCard from './RoomCard';

/**
 * RoomGrid — renders one RoomCard per room entry from Firebase.
 * Props: rooms, sensor, unit, gasMode, error
 */
function RoomGrid({ rooms, sensor, unit, gasMode = false, error }) {
  if (error) {
    return (
      <div className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        {error}
      </div>
    );
  }

  const roomEntries = Object.entries(rooms).filter(
    ([, data]) => data[sensor] !== undefined
  );

  if (roomEntries.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-3 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
        Waiting for data from ESP32…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
      {roomEntries.map(([roomId, data]) => (
        <RoomCard
          key={roomId}
          roomId={roomId}
          value={data[sensor]}
          unit={unit}
          gasMode={gasMode}
          updatedAt={data.updatedAt ?? null}
        />
      ))}
    </div>
  );
}

export default RoomGrid;
