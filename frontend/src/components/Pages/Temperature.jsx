import React from 'react';
import { dbMain } from '../../firebaseMain';
import useRoomsData from '../../hooks/useRoomsData';
import RoomGrid from '../Dashboard/RoomGrid';

function Temperature() {
  const { rooms, error } = useRoomsData(dbMain);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Temperature</h2>
        <p className="text-sm text-gray-400 mt-1">
          Live ambient temperature per room — updates automatically.
        </p>
      </div>
      <RoomGrid rooms={rooms} sensor="temperature" unit="°C" error={error} />
    </div>
  );
}

export default Temperature;
