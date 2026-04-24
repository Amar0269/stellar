import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';

/**
 * Attaches a single real-time Firebase listener to `rooms/` on the given db.
 *
 * @param {import('firebase/database').Database} db
 *   Pass `dbMain` for temperature/gas/humidity, or `dbDustbin` for dustbin.
 *
 * Firebase shape expected:
 *   rooms → {
 *     "204": { temperature, gas, humidity, updatedAt },   ← Main DB
 *     "204": { dustbin, updatedAt },                      ← Dustbin DB
 *   }
 *
 * Returns:
 *   rooms  – raw rooms object keyed by roomId  { "204": {...}, "205": {...} }
 *   error  – string | null
 *
 * Adding a new roomId in Firebase will automatically surface
 * a new entry in the returned `rooms` object → a new RoomCard renders.
 */
function useRoomsData(db) {
  const [rooms, setRooms] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) return;

    const roomsRef = ref(db, 'rooms');

    const unsubscribe = onValue(
      roomsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRooms({});
          return;
        }
        setRooms(snapshot.val());   // keep the full object — pages filter per-sensor
        setError(null);
      },
      (err) => {
        console.error('Firebase read error:', err);
        setError('Unable to connect to Firebase.');
      }
    );

    return () => unsubscribe();   // unsubscribe on unmount
  }, [db]);

  return { rooms, error };
}

export default useRoomsData;
