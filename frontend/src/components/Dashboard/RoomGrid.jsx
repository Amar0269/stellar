import React from 'react';

function RoomGrid({ rooms, error, unit }) {
  if (error) {
    return <p className="text-sm text-red-400 mt-4">{error}</p>;
  }

  if (rooms.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="inline-block w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
        Waiting for data from ESP32...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {rooms.map(({ roomId, value, updatedAt }) => (
        <div
          key={roomId}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:border-orange-200 hover:shadow-md transition-all duration-150"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Room
            </span>
            {updatedAt && (
              <span className="text-xs text-gray-300">
                {new Date(updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Room ID */}
          <p className="text-sm font-semibold text-gray-700">{roomId}</p>

          {/* Sensor value */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{value}</span>
            <span className="text-sm text-gray-400">{unit}</span>
          </div>

          {/* Orange accent bar */}
          <div className="h-0.5 w-full bg-orange-100 rounded-full">
            <div className="h-0.5 bg-orange-400 rounded-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default RoomGrid;
