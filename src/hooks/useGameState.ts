import { useEffect, useState } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../firebase";
import {
  calculateScore,
  getNextAnswering,
  normalizeClue,
} from "../helpers/gameHelpers";

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
  message: "right" | "wrong" | "pass" | "duplicate" | null;
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
  // If ALL clues are identical, skip filter and auto-pass directly
  useEffect(() => {
    if (!roomId) return;
    if (state.phase !== "clue") return;
    if (playerCount === 0) return;

    const clueCount = Object.keys(state.clues).length;
    const expectedClues = playerCount - 1; // everyone except guesser

    if (clueCount < expectedClues || expectedClues <= 0) return;

    // Check if all clues are identical — if so, skip filter entirely
    const clueTexts = Object.values(state.clues);
    const normalized = clueTexts.map(normalizeClue);
    const allSame = normalized.every((c) => c === normalized[0]);

    if (allSame) {
      const score = calculateScore("pass", state.points, state.lostPoints);
      const nextRound = state.round + 1;

      update(ref(db, `rooms/${roomId}/game`), {
        invalidClues: Object.keys(state.clues).map(Number),
        validClues: [],
        points: score.points,
        lostPoints: score.lostPoints,
        message: "duplicate",
        [`results/${state.round}`]: "pass",
        round: nextRound,
        answering: getNextAnswering(nextRound, playerCount),
        phase: "clue",
        clues: null,
        guess: null,
      });
    } else {
      set(ref(db, `rooms/${roomId}/game/phase`), "filter");
    }
  }, [roomId, state.phase, state.clues, state.round, state.points, state.lostPoints, playerCount]);

  // Auto-transition: validate → right when guess matches word exactly
  useEffect(() => {
    if (!roomId) return;
    if (state.phase !== "validate") return;
    if (!state.guess) return;

    const word = state.words[state.round];
    if (!word) return;
    if (normalizeClue(state.guess) !== normalizeClue(word)) return;

    const score = calculateScore("right", state.points, state.lostPoints);
    const nextRound = state.round + 1;

    update(ref(db, `rooms/${roomId}/game`), {
      points: score.points,
      lostPoints: score.lostPoints,
      message: "right",
      [`results/${state.round}`]: "right",
      round: nextRound,
      answering: getNextAnswering(nextRound, playerCount),
      phase: "clue",
      clues: null,
      invalidClues: null,
      validClues: null,
      guess: null,
    });
  }, [roomId, state.phase, state.guess, state.words, state.round, state.points, state.lostPoints, playerCount]);

  return state;
}
