import React, { useEffect, useRef } from 'react';

/**
 * RoomCard — one card per room, one sensor value shown.
 *
 * Props:
 *   roomId    – string  e.g. "204"
 *   value     – number | string | undefined  (the sensor reading)
 *   unit      – string  e.g. "°C", "%"
 *   gasMode   – bool    if true, show gas-detection status instead of unit
 *   updatedAt – number | string | null  (Firebase timestamp or ISO string)
 */
function RoomCard({ roomId, value, unit, gasMode = false, updatedAt }) {
  const hasValue = value !== null && value !== undefined;

  // Gas detection logic: threshold is 3000
  const gasDetected = gasMode && hasValue && Number(value) > 3000;

  // Fire a browser alert once when gas is first detected for this room.
  // The ref prevents repeated alerts on every re-render.
  const alertedRef = useRef(false);
  useEffect(() => {
    if (gasDetected && !alertedRef.current) {
      alertedRef.current = true;
      alert(`⚠️ Gas Detected in Room ${roomId}! Sensor value: ${value}`);
    }
    if (!gasDetected) {
      // Reset so we can alert again if gas clears and comes back
      alertedRef.current = false;
    }
  }, [gasDetected, roomId, value]);

  // ESP32 may send updatedAt as Unix seconds (10-digit) or milliseconds (13-digit).
  // JavaScript Date always expects milliseconds, so we normalise.
  const timeLabel = updatedAt
    ? new Date(updatedAt > 1e10 ? updatedAt : updatedAt * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:border-orange-200 hover:shadow-md transition-all duration-150">

      {/* Header: room label + timestamp */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Room
        </span>
        {timeLabel && (
          <span className="text-xs text-gray-300">{timeLabel}</span>
        )}
      </div>

      {/* Room ID */}
      <p className="text-sm font-semibold text-gray-700">{roomId}</p>

      {/* Sensor value */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {hasValue ? (
          <>
            <span className="text-3xl font-bold text-gray-800">{value}</span>
            {gasMode ? (
              <span
                className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                  gasDetected
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {gasDetected ? 'Gas Detected' : 'No Gas Detected'}
              </span>
            ) : (
              <span className="text-sm text-gray-400">{unit}</span>
            )}
          </>
        ) : (
          <span className="text-2xl font-semibold text-gray-300">—</span>
        )}
      </div>

      {/* Orange accent bar */}
      <div className="h-0.5 w-full bg-orange-100 rounded-full">
        <div className="h-0.5 bg-orange-400 rounded-full w-full" />
      </div>
    </div>
  );
}

export default RoomCard;
