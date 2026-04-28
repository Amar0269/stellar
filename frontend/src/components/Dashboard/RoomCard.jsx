import React, { useEffect, useRef } from 'react';

/**
 * RoomCard — one card per room, one sensor value shown.
 * Props: roomId, value, unit, gasMode, updatedAt
 * All accent/color props removed — uses a single clean design system.
 */
function RoomCard({ roomId, value, unit, gasMode = false, updatedAt }) {
  const hasValue = value !== null && value !== undefined;
  const gasDetected = gasMode && hasValue && Number(value) > 3000;

  const alertedRef = useRef(false);
  useEffect(() => {
    if (gasDetected && !alertedRef.current) {
      alertedRef.current = true;
      alert(`Gas Detected in Room ${roomId}! Sensor value: ${value}`);
    }
    if (!gasDetected) alertedRef.current = false;
  }, [gasDetected, roomId, value]);

  const timeLabel = updatedAt
    ? new Date(updatedAt > 1e10 ? updatedAt : updatedAt * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-orange-300 hover:shadow-md transition-all duration-200">

      {/* Top: Room label + timestamp */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Room {roomId}
        </span>
        {timeLabel && (
          <span className="text-xs text-gray-400">{timeLabel}</span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        {hasValue ? (
          <>
            <span className="text-4xl font-black text-gray-900 leading-none tabular-nums">
              {value}
            </span>
            {gasMode ? (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  gasDetected
                    ? 'bg-red-50 text-red-500 border border-red-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}
              >
                {gasDetected ? 'Gas Detected' : 'No Gas'}
              </span>
            ) : (
              <span className="text-lg font-semibold text-gray-400">{unit}</span>
            )}
          </>
        ) : (
          <span className="text-3xl font-bold text-gray-300">—</span>
        )}
      </div>

      {/* Footer: live indicator */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
        <span className="text-xs text-gray-400">Live</span>
      </div>
    </div>
  );
}

export default RoomCard;
