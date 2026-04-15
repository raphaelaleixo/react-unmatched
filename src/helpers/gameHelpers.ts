// src/helpers/gameHelpers.ts
import wordsEn from "../data/words";
import wordsPtBr from "../data/words_pt_br";

export function pickWords(lang: "en" | "pt_br", count: number): string[] {
  const source = lang === "pt_br" ? wordsPtBr : wordsEn;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getFilterPlayer(
  answering: number,
  playerCount: number,
): number {
  return (answering % playerCount) + 1;
}

export function getNextAnswering(
  round: number,
  playerCount: number,
): number {
  return (round % playerCount) + 1;
}

export function normalizeClue(s: string): string {
  return s.trim().toLowerCase();
}

export function getCluesPerHinter(playerCount: number): number {
  return playerCount <= 4 ? 2 : 1;
}

export function makeClueKey(playerId: number, clueIndex: number): string {
  return `${playerId}_${clueIndex}`;
}

export function parseClueKey(key: string): { playerId: number; clueIndex: number } {
  const [pid, idx] = key.split("_");
  return { playerId: Number(pid), clueIndex: Number(idx) };
}

export function getExpectedClueCount(playerCount: number): number {
  return (playerCount - 1) * getCluesPerHinter(playerCount);
}

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

export function isGameOver(round: number): boolean {
  return round > 12;
}

export function calculateFinalScore(results: Record<number, "right" | "wrong" | "pass">): number {
  let score = 0;
  for (const result of Object.values(results)) {
    if (result === "right") score += 1;
    else if (result === "wrong") score -= 1;
  }
  return score;
}

export function getFinishSubtitleKey(score: number): string {
  if (score >= 13) return "finish.subtitle13";
  if (score >= 12) return "finish.subtitle12";
  if (score >= 11) return "finish.subtitle11";
  if (score >= 9) return "finish.subtitle9";
  if (score >= 7) return "finish.subtitle7";
  if (score >= 4) return "finish.subtitle4";
  return "finish.subtitle0";
}
