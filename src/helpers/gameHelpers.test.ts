// src/helpers/gameHelpers.test.ts
import { describe, it, expect } from "vitest";
import {
  pickWords,
  getFilterPlayer,
  getNextAnswering,
  calculateFinalScore,
  isGameOver,
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
