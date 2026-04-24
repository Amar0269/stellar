import React from 'react';
import { dbDustbin } from '../../firebaseDustbin';
import useRoomsData from '../../hooks/useRoomsData';
import RoomGrid from '../Dashboard/RoomGrid';

function Dustbin() {
  const { rooms, error } = useRoomsData(dbDustbin);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Dustbin</h2>
        <p className="text-sm text-gray-400 mt-1">
          Live bin fill level per room — updates automatically.
        </p>
      </div>
      <RoomGrid rooms={rooms} sensor="dustbin" unit="%" error={error} />
    </div>
  );
}

export default Dustbin;
