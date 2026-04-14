import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "../firebase";
import type { RoomState, PlayerSlot } from "react-gameroom";

function parsePlayersArray(raw: unknown): PlayerSlot[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, PlayerSlot>);
  }
  return [];
}

function snapshotToRoomState(data: Record<string, unknown>): RoomState {
  return {
    roomId: data.roomId as string,
    status: data.status as RoomState["status"],
    players: parsePlayersArray(data.players),
    config: data.config as RoomState["config"],
  };
}

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
          setRoomState(snapshotToRoomState(data));
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

export async function findFirstEmptySlot(
  roomId: string,
): Promise<number | null> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state/players`));
  const players = parsePlayersArray(snapshot.val());
  const empty = players.find((p) => p.status === "empty");
  return empty ? empty.id : null;
}
