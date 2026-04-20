import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

/**
 * Listens to Firebase: rooms/ → roomId → { temperature, gas, humidity, dustbin, updatedAt }
 * Returns an array of { roomId, value, updatedAt } for the given sensorKey.
 * New rooms added to Firebase automatically appear — no hardcoding.
 */
function useSensorData(sensorKey) {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const roomsRef = ref(db, 'rooms');

    const unsubscribe = onValue(
      roomsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRooms([]);
          return;
        }

        const data = snapshot.val();

        // Dynamically map each roomId to its sensor value
        const result = Object.entries(data)
          .filter(([, roomData]) => roomData[sensorKey] !== undefined)
          .map(([roomId, roomData]) => ({
            roomId,
            value: roomData[sensorKey],
            updatedAt: roomData.updatedAt ?? null,
          }));

        setRooms(result);
        setError(null);
      },
      (err) => {
        console.error('Firebase read error:', err);
        setError('Unable to connect to Firebase.');
      }
    );

    return () => unsubscribe();
  }, [sensorKey]);

  return { rooms, error };
}

export default useSensorData;
