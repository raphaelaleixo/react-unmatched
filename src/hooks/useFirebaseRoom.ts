/**
 * useFirebaseRoom — subscribes to a room's state in Firebase RTDB.
 *
 * Returns:
 *   - roomState:  the deserialized RoomState (or null while loading)
 *   - loading:    true until the first snapshot arrives
 *   - error:      error message if the room doesn't exist or Firebase fails
 *   - updateRoom: writes a full RoomState back to Firebase
 *
 * Also exports two standalone helpers:
 *   - roomExists(roomId) — one-shot check used by the join page
 *   - findFirstEmptySlot(roomId) — finds the next open player slot
 */
import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "../firebase";
import { deserializeRoom } from "react-gameroom";
import type { RoomState, RoomStatus } from "react-gameroom";

export function useFirebaseRoom(roomId: string | undefined) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomState(deserializeRoom(data));
          setError(null);
        } else {
          setRoomState(null);
          setError("Room not found");
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [roomId]);

  const updateRoom = useCallback(
    async (newState: RoomState) => {
      if (!roomId) return;
      await set(ref(db, `rooms/${roomId}/state`), newState);
    },
    [roomId],
  );

  return { roomState, loading, error, updateRoom };
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state/roomId`));
  return snapshot.exists();
}

export async function getRoomStatus(
  roomId: string,
): Promise<RoomStatus | null> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state`));
  const val = snapshot.val();
  if (!val || !val.roomId) return null;
  return val.status === "started" ? "started" : "lobby";
}

export async function findFirstEmptySlot(
  roomId: string,
): Promise<number | null> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state`));
  const room = deserializeRoom(snapshot.val());
  const players = room.players;
  const empty = players.find((p) => p.status === "empty");
  return empty ? empty.id : null;
}
