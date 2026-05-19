// src/helpers/gameHelpers.test.ts
import { describe, it, expect } from "vitest";
import {
  pickWords,
  getFilterPlayer,
  getNextAnswering,
  calculateFinalScore,
  isGameOver,
  parseWordList,
  findDuplicates,
  getGameWords,
  buildNextRoundUpdate,
} from "./gameHelpers";

describe("pickWords", () => {
  it("returns the requested number of words", () => {
    const words = pickWords("en", 13);
    expect(words).toHaveLength(13);
  });

  it("returns unique words", () => {
    const words = pickWords("en", 13);
    expect(new Set(words).size).toBe(13);
  });

  it("picks from Portuguese list when lang is pt_br", () => {
    const words = pickWords("pt_br", 13);
    expect(words).toHaveLength(13);
  });
});

describe("getFilterPlayer", () => {
  it("returns next player after answering (4 players)", () => {
    expect(getFilterPlayer(1, 4)).toBe(2);
    expect(getFilterPlayer(2, 4)).toBe(3);
    expect(getFilterPlayer(3, 4)).toBe(4);
  });

  it("wraps around to player 1", () => {
    expect(getFilterPlayer(4, 4)).toBe(1);
  });
});

describe("getNextAnswering", () => {
  it("rotates through players based on round", () => {
    expect(getNextAnswering(0, 4)).toBe(1);
    expect(getNextAnswering(1, 4)).toBe(2);
    expect(getNextAnswering(2, 4)).toBe(3);
    expect(getNextAnswering(3, 4)).toBe(4);
  });

  it("wraps around after all players have answered", () => {
    expect(getNextAnswering(4, 4)).toBe(1);
  });
});

describe("calculateFinalScore", () => {
  it("adds 1 point per correct guess", () => {
    expect(calculateFinalScore({ 0: "right", 1: "right", 2: "right" })).toBe(3);
  });

  it("subtracts 1 point per wrong guess", () => {
    expect(calculateFinalScore({ 0: "right", 1: "wrong", 2: "right" })).toBe(1);
  });

  it("passes cost nothing", () => {
    expect(calculateFinalScore({ 0: "right", 1: "pass", 2: "right" })).toBe(2);
  });

  it("returns 0 for an empty game", () => {
    expect(calculateFinalScore({})).toBe(0);
  });
});

describe("isGameOver", () => {
  it("returns true when round exceeds 12", () => {
    expect(isGameOver(13)).toBe(true);
  });

  it("returns false when game is still in progress", () => {
    expect(isGameOver(5)).toBe(false);
    expect(isGameOver(12)).toBe(false);
  });
});

describe("parseWordList", () => {
  it("splits on newlines", () => {
    expect(parseWordList("apple\nbanana\ncherry")).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("splits on commas", () => {
    expect(parseWordList("apple,banana,cherry")).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("splits on a mix of newlines and commas", () => {
    expect(parseWordList("apple,banana\ncherry,date\nelderberry")).toEqual([
      "apple",
      "banana",
      "cherry",
      "date",
      "elderberry",
    ]);
  });

  it("trims whitespace from each token", () => {
    expect(parseWordList("  apple , banana ,\n  cherry  ")).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("drops empty tokens", () => {
    expect(parseWordList("apple,,banana\n\ncherry,")).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseWordList("")).toEqual([]);
  });

  it("preserves multi-word entries (only splits on newlines and commas)", () => {
    expect(parseWordList("ice cream\nhot dog")).toEqual(["ice cream", "hot dog"]);
  });
});

describe("findDuplicates", () => {
  it("returns an empty array when all words are unique", () => {
    expect(findDuplicates(["apple", "banana", "cherry"])).toEqual([]);
  });

  it("returns the duplicate values (one entry per duplicated value)", () => {
    expect(findDuplicates(["apple", "banana", "apple", "cherry"])).toEqual([
      "apple",
    ]);
  });

  it("detects duplicates case-insensitively", () => {
    expect(findDuplicates(["Apple", "BANANA", "apple", "banana"])).toEqual([
      "Apple",
      "BANANA",
    ]);
  });

  it("returns each duplicated value only once even if it repeats 3+ times", () => {
    expect(findDuplicates(["apple", "apple", "apple", "banana"])).toEqual([
      "apple",
    ]);
  });

  it("preserves the casing of the first occurrence", () => {
    expect(findDuplicates(["Banana", "banana"])).toEqual(["Banana"]);
  });

  it("returns empty for an empty array", () => {
    expect(findDuplicates([])).toEqual([]);
  });
});

describe("getGameWords", () => {
  it("falls back to the default word bank when customWords is undefined", () => {
    const words = getGameWords(undefined, "en");
    expect(words).toHaveLength(13);
    for (const w of words) expect(typeof w).toBe("string");
    for (const w of words) expect(w.length).toBeGreaterThan(0);
  });

  it("falls back to the default word bank when customWords is an empty array", () => {
    const words = getGameWords([], "en");
    expect(words).toHaveLength(13);
  });

  it("falls back when customWords has fewer than 13 entries", () => {
    const tooFew = Array.from({ length: 12 }, (_, i) => `word${i}`);
    const words = getGameWords(tooFew, "en");
    expect(words).toHaveLength(13);
    expect(words.some((w) => w.startsWith("word"))).toBe(false);
  });

  it("uses customWords when length === 13 (returns exactly those 13, possibly reordered)", () => {
    const exactly13 = Array.from({ length: 13 }, (_, i) => `custom${i}`);
    const result = getGameWords(exactly13, "en");
    expect(result).toHaveLength(13);
    expect([...result].sort()).toEqual([...exactly13].sort());
  });

  it("slices to exactly 13 when customWords has more than 13", () => {
    const tooMany = Array.from({ length: 30 }, (_, i) => `custom${i}`);
    const result = getGameWords(tooMany, "en");
    expect(result).toHaveLength(13);
    for (const w of result) expect(tooMany).toContain(w);
  });

  it("respects the lang argument when falling back to defaults (pt_br vs en differ)", () => {
    const en = getGameWords(undefined, "en");
    const pt = getGameWords(undefined, "pt_br");
    expect(en).toHaveLength(13);
    expect(pt).toHaveLength(13);
    expect(en).not.toEqual(pt);
  });
});

describe("buildNextRoundUpdate", () => {
  it("returns the base round-end fields with no history when no history arg is given", () => {
    const update = buildNextRoundUpdate(2, 4, "pass");
    expect(update).toMatchObject({
      message: "pass",
      "results/2": "pass",
      round: 3,
      answering: 4,
      phase: "clue",
      clues: null,
      guess: null,
    });
    expect(update).not.toHaveProperty("clueHistory/2");
    expect(update).not.toHaveProperty("invalidCluesHistory/2");
    expect(update).not.toHaveProperty("guessHistory/2");
    expect(update).not.toHaveProperty("guesserHistory/2");
  });

  it("maps a 'duplicate' message to a 'pass' result", () => {
    const update = buildNextRoundUpdate(0, 3, "duplicate");
    expect(update["results/0"]).toBe("pass");
  });

  it("writes all four history records when history is provided", () => {
    const clues = { "1_0": "ocean", "2_0": "tentacles" };
    const update = buildNextRoundUpdate(5, 3, "wrong", {
      clues,
      invalidClues: ["1_0"],
      guess: "squid",
      guesser: 3,
    });
    expect(update["clueHistory/5"]).toEqual(clues);
    expect(update["invalidCluesHistory/5"]).toEqual(["1_0"]);
    expect(update["guessHistory/5"]).toBe("squid");
    expect(update["guesserHistory/5"]).toBe(3);
  });

  it("accepts a null guess in the history (pass / duplicate path)", () => {
    const update = buildNextRoundUpdate(0, 3, "pass", {
      clues: { "1_0": "x" },
      invalidClues: ["1_0"],
      guess: null,
      guesser: 1,
    });
    expect(update["guessHistory/0"]).toBeNull();
    expect(update["guesserHistory/0"]).toBe(1);
  });
});
