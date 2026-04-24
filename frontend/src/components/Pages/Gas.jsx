import React from 'react';
import { dbMain } from '../../firebaseMain';
import useRoomsData from '../../hooks/useRoomsData';
import RoomGrid from '../Dashboard/RoomGrid';

function Gas() {
  const { rooms, error } = useRoomsData(dbMain);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gas</h2>
        <p className="text-sm text-gray-400 mt-1">
          Live gas concentration per room — updates automatically.
        </p>
      </div>
      <RoomGrid rooms={rooms} sensor="gas" unit="ppm" error={error} />
    </div>
  );
}

export default Gas;
