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

export function calculateScore(
  result: "right" | "wrong" | "pass",
  points: number,
  lostPoints: number,
): { points: number; lostPoints: number } {
  switch (result) {
    case "right":
      return { points: points + 1, lostPoints };
    case "wrong":
      return { points, lostPoints: lostPoints + 2 };
    case "pass":
      return { points, lostPoints: lostPoints + 1 };
  }
}

export function normalizeClue(s: string): string {
  return s.trim().toLowerCase();
}

export function findDuplicateClueIds(clues: Record<number, string>): number[] {
  const groups: Record<string, number[]> = {};
  for (const [id, text] of Object.entries(clues)) {
    const key = normalizeClue(text);
    if (!groups[key]) groups[key] = [];
    groups[key].push(Number(id));
  }
  return Object.values(groups)
    .filter((ids) => ids.length >= 2)
    .flat();
}

export function isGameOver(
  points: number,
  lostPoints: number,
  round: number,
): boolean {
  return points + lostPoints >= 13 || round > 12;
}
