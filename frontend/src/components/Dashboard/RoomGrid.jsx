import React from 'react';
import RoomCard from './RoomCard';

/**
 * RoomGrid — renders one RoomCard per room entry.
 *
 * Props:
 *   rooms    – object keyed by roomId: { "204": { temperature, gas, … }, … }
 *              A new key in Firebase → a new RoomCard renders automatically.
 *   sensor   – string  which field to display  e.g. 'temperature'
 *   unit     – string  display unit            e.g. '°C'
 *   gasMode  – bool    if true, show gas-detection status instead of unit
 *   error    – string | null
 */
function RoomGrid({ rooms, sensor, unit, gasMode = false, error }) {
  if (error) {
    return <p className="text-sm text-red-400 mt-4">{error}</p>;
  }

  const roomEntries = Object.entries(rooms).filter(
    ([, data]) => data[sensor] !== undefined
  );

  if (roomEntries.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="inline-block w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
        Waiting for data from ESP32…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
