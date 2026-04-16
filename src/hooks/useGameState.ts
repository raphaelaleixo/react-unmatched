/**
 * useGameState — subscribes to the game state in Firebase and handles
 * automatic phase transitions.
 *
 * The game has 4 phases per round: clue → filter → guess → validate.
 * Two transitions happen automatically (without player action):
 *   1. clue → filter: when all hinters have submitted their clues
 *      (or auto-pass if every clue is identical)
 *   2. validate → clue: when the guess exactly matches the word
 *      (skip manual validation, auto-mark as correct)
 *
 * All other transitions are triggered by player actions in the UI components.
 */
import { useEffect, useState } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "../firebase";
import {
  getExpectedClueCount,
  normalizeClue,
  buildNextRoundUpdate,
} from "../helpers/gameHelpers";

/** Shape of the full game state stored in Firebase under /rooms/{id}/game. */
export interface GameState {
  phase: "clue" | "filter" | "guess" | "validate" | null;
  round: number;                                        // 0-based round index
  words: string[];                                      // all 13 words for the game
  answering: number;                                    // player ID of the current guesser
  clues: Record<string, string>;                        // "playerId_clueIndex" → clue text
  invalidClues: string[];                               // clue keys marked invalid by filter
  validClues: string[];                                 // clue texts approved for the guesser
  guess: string | null;                                 // the guesser's submitted answer
  message: "right" | "wrong" | "pass" | "duplicate" | null;  // result shown in overlay
  clueHistory: Record<number, Record<string, string>>;  // past rounds' clues (for overlay)
  results: Record<number, "right" | "wrong" | "pass">;  // per-round outcomes
  lang: "en" | "pt_br";                                 // language for word bank
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
  message: null,
  clueHistory: {},
  results: {},
  lang: "en",
};

export function useGameState(
  roomId: string | undefined,
  playerCount: number,
): GameState {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  // --- Firebase listener: sync game state from the database ---
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
        message: data.message ?? null,
        clueHistory: data.clueHistory ?? {},
        results: data.results ?? {},
        lang: data.lang ?? "en",
      });
    });

    return unsub;
  }, [roomId]);

  // --- Auto-transition: clue → filter ---
  // When all hinters have submitted their clues, move to the filter phase.
  // Special case: if ALL clues are identical (case-insensitive), skip filter
  // entirely and auto-pass the round — no point in filtering duplicates.
  useEffect(() => {
    if (!roomId) return;
    if (state.phase !== "clue") return;
    if (playerCount === 0) return;

    const clueCount = Object.keys(state.clues).length;
    const expectedClues = getExpectedClueCount(playerCount);

    if (clueCount < expectedClues || expectedClues <= 0) return;

    const clueTexts = Object.values(state.clues);
    const normalized = clueTexts.map(normalizeClue);
    const allSame = normalized.every((c) => c === normalized[0]);

    if (allSame) {
      // Every clue is the same word — auto-pass and show "duplicate" overlay
      update(ref(db, `rooms/${roomId}/game`), {
        ...buildNextRoundUpdate(state.round, playerCount, "duplicate", {
          [`clueHistory/${state.round}`]: state.clues,
        }),
        invalidClues: Object.keys(state.clues),
        validClues: [],
      });
    } else {
      // Normal case — move to filter phase for the filter player to review
      set(ref(db, `rooms/${roomId}/game/phase`), "filter");
    }
  }, [roomId, state.phase, state.clues, state.round, playerCount]);

  // --- Auto-transition: validate → right ---
  // If the guesser's answer matches the word exactly (case-insensitive),
  // skip the manual validation step and auto-mark as correct.
  useEffect(() => {
    if (!roomId) return;
    if (state.phase !== "validate") return;
    if (!state.guess) return;

    const word = state.words[state.round];
    if (!word) return;
    if (normalizeClue(state.guess) !== normalizeClue(word)) return;

    update(ref(db, `rooms/${roomId}/game`), {
      ...buildNextRoundUpdate(state.round, playerCount, "right", {
        [`clueHistory/${state.round}`]: state.clues,
      }),
      invalidClues: null,
      validClues: null,
    });
  }, [roomId, state.phase, state.guess, state.words, state.round, playerCount]);

  return state;
}
