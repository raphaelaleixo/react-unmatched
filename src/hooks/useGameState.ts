import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebase";

export interface GameState {
  phase: "clue" | "filter" | "guess" | "validate" | null;
  round: number;
  words: string[];
  answering: number;
  clues: Record<number, string>;
  invalidClues: number[];
  validClues: string[];
  guess: string | null;
  points: number;
  lostPoints: number;
  message: "right" | "wrong" | "pass" | null;
  results: Record<number, "right" | "wrong" | "pass">;
  lang: "en" | "pt_br";
}

const INITIAL_STATE: GameState = {
  phase: null,
  round: 0,
  words: [],
  answering: 0,
  clues: {},
  invalidClues: [],
  validClues: [],
  guess: null,
  points: 0,
  lostPoints: 0,
  message: null,
  results: {},
  lang: "en",
};

export function useGameState(
  roomId: string | undefined,
  playerCount: number,
): GameState {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    if (!roomId) return;

    const gameRef = ref(db, `rooms/${roomId}/game`);

    const unsub = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setState({
        phase: data.phase ?? null,
        round: data.round ?? 0,
        words: data.words ?? [],
        answering: data.answering ?? 0,
        clues: data.clues ?? {},
        invalidClues: data.invalidClues ?? [],
        validClues: data.validClues ?? [],
        guess: data.guess ?? null,
        points: data.points ?? 0,
        lostPoints: data.lostPoints ?? 0,
        message: data.message ?? null,
        results: data.results ?? {},
        lang: data.lang ?? "en",
      });
    });

    return unsub;
  }, [roomId]);

  // Auto-transition: clue → filter when all clues are in
  useEffect(() => {
    if (!roomId) return;
    if (state.phase !== "clue") return;
    if (playerCount === 0) return;

    const clueCount = Object.keys(state.clues).length;
    const expectedClues = playerCount - 1; // everyone except guesser

    if (clueCount >= expectedClues && expectedClues > 0) {
      set(ref(db, `rooms/${roomId}/game/phase`), "filter");
    }
  }, [roomId, state.phase, state.clues, playerCount]);

  return state;
}
