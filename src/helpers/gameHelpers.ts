// src/helpers/gameHelpers.ts
//
// Pure utility functions for game logic. None of these touch Firebase
// directly — they compute values that callers write to the database.

import wordsEn from "../data/words";
import wordsPtBr from "../data/words_pt_br";

/**
 * Shuffle-pick `count` random words from the word bank for the given language.
 * Used at game start to generate the 13 round words.
 */
export function pickWords(lang: "en" | "pt_br", count: number): string[] {
  const source = lang === "pt_br" ? wordsPtBr : wordsEn;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * The filter player is always the player seated right after the guesser.
 * They review clues for duplicates and later validate the guess.
 */
export function getFilterPlayer(
  answering: number,
  playerCount: number,
): number {
  return (answering % playerCount) + 1;
}

/**
 * Rotate the guesser each round. Player IDs are 1-based, so we mod
 * the round number by the player count and add 1.
 */
export function getNextAnswering(
  round: number,
  playerCount: number,
): number {
  return (round % playerCount) + 1;
}

/** Trim whitespace and lowercase — used to compare clues and guesses. */
export function normalizeClue(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * In smaller games (3-4 players) each hinter gives 2 clues so the guesser
 * has more to work with. In larger games 1 clue each is enough.
 */
export function getCluesPerHinter(playerCount: number): number {
  return playerCount <= 4 ? 2 : 1;
}

/**
 * Build a Firebase key for a single clue: "playerId_clueIndex".
 * Example: player 3's second clue → "3_1"
 */
export function makeClueKey(playerId: number, clueIndex: number): string {
  return `${playerId}_${clueIndex}`;
}

/** Reverse of makeClueKey — extract the player ID and clue index from a key. */
export function parseClueKey(key: string): { playerId: number; clueIndex: number } {
  const [pid, idx] = key.split("_");
  return { playerId: Number(pid), clueIndex: Number(idx) };
}

/** Total number of clues expected before moving to the filter phase. */
export function getExpectedClueCount(playerCount: number): number {
  return (playerCount - 1) * getCluesPerHinter(playerCount);
}

/** Check whether a specific player has submitted all of their clues. */
export function hasPlayerSubmittedAllClues(
  clues: Record<string, string>,
  playerId: number,
  cluesPerHinter: number,
): boolean {
  for (let i = 0; i < cluesPerHinter; i++) {
    if (!(makeClueKey(playerId, i) in clues)) return false;
  }
  return true;
}

/** Count how many hinters have finished submitting all their clues. */
export function countReadyHinters(
  clues: Record<string, string>,
  playerCount: number,
): number {
  const cluesPerHinter = getCluesPerHinter(playerCount);
  const playerIds = new Set(
    Object.keys(clues).map((k) => parseClueKey(k).playerId),
  );
  let count = 0;
  for (const pid of playerIds) {
    if (hasPlayerSubmittedAllClues(clues, pid, cluesPerHinter)) count++;
  }
  return count;
}

/**
 * Find clue keys whose text matches another clue (case-insensitive).
 * Returns all keys that belong to any duplicate group (2+ identical clues).
 */
export function findDuplicateClueIds(clues: Record<string, string>): string[] {
  const groups: Record<string, string[]> = {};
  for (const [key, text] of Object.entries(clues)) {
    const norm = normalizeClue(text);
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(key);
  }
  return Object.values(groups)
    .filter((keys) => keys.length >= 2)
    .flat();
}

/** The game always plays exactly 13 rounds (indices 0–12). */
export function isGameOver(round: number): boolean {
  return round > 12;
}

/**
 * Final score: +1 per correct guess, −1 per wrong guess, passes are free.
 * Range: −13 to +13 (though −13 requires wrong every round).
 */
export function calculateFinalScore(results: Record<number, "right" | "wrong" | "pass">): number {
  let score = 0;
  for (const result of Object.values(results)) {
    if (result === "right") score += 1;
    else if (result === "wrong") score -= 1;
  }
  return score;
}

/** Map final score to a translation key for the end-game flavor text. */
export function getFinishSubtitleKey(score: number): string {
  if (score >= 13) return "finish.subtitle13";
  if (score >= 12) return "finish.subtitle12";
  if (score >= 11) return "finish.subtitle11";
  if (score >= 9) return "finish.subtitle9";
  if (score >= 7) return "finish.subtitle7";
  if (score >= 4) return "finish.subtitle4";
  return "finish.subtitle0";
}

/**
 * Build the Firebase update object that advances the game to the next round.
 *
 * Every round transition shares the same core fields (increment round, rotate
 * guesser, reset phase to "clue", clear transient data). Callers pass in the
 * round-specific result and message, plus any extra fields they need.
 *
 * @param round       - the round that just ended (0-based)
 * @param playerCount - total active players (for guesser rotation)
 * @param message     - result type shown in the overlay ("right" | "wrong" | "pass" | "duplicate")
 * @param extras      - additional fields to merge (e.g. clueHistory, invalidClues)
 */
export function buildNextRoundUpdate(
  round: number,
  playerCount: number,
  message: string,
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  const nextRound = round + 1;
  return {
    message,
    [`results/${round}`]: message === "duplicate" ? "pass" : message,
    round: nextRound,
    answering: getNextAnswering(nextRound, playerCount),
    phase: "clue",
    clues: null,
    guess: null,
    ...extras,
  };
}
