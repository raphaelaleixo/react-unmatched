import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "../i18n";
import i18n from "../i18n";
import RoundResultOverlay from "./RoundResultOverlay";
import type { GameState } from "../hooks/useGameState";

const PLAYER_NAMES = { 1: "Maria", 2: "João", 3: "Ana" };

function baseState(overrides: Partial<GameState>): GameState {
  return {
    phase: "clue",
    round: 1, // round just ended = 0
    words: ["octopus"],
    answering: 2,
    clues: {},
    invalidClues: [],
    validClues: [],
    guess: null,
    message: null,
    clueHistory: {},
    invalidCluesHistory: {},
    guessHistory: {},
    guesserHistory: { 0: 1 }, // round 0 was guessed by player 1 (Maria)
    results: {},
    lang: "en",
    customWords: undefined,
    ...overrides,
  };
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RoundResultOverlay", () => {
  it("renders nothing when there is no message", () => {
    const { container } = render(
      <RoundResultOverlay
        gameState={baseState({ message: null })}
        playerNames={PLAYER_NAMES}
      />,
    );
    expect(container.querySelector(".round-result-overlay")).toBeNull();
  });

  it("renders the word and a chip per clue on a 'right' result", () => {
    render(
      <RoundResultOverlay
        gameState={baseState({
          message: "right",
          clueHistory: { 0: { "2_0": "ocean", "3_0": "tentacles" } },
          invalidCluesHistory: { 0: [] },
          guessHistory: { 0: "octopus" },
        })}
        playerNames={PLAYER_NAMES}
      />,
    );
    expect(screen.getByText("octopus")).toBeInTheDocument();
    const chips = document.querySelectorAll(".round-result-overlay__chip");
    expect(chips).toHaveLength(2);
    // Guess line is hidden on 'right'
    expect(screen.queryByText(/guessed:/i)).toBeNull();
  });

  it("renders the guess line and chips on a 'wrong' result", () => {
    render(
      <RoundResultOverlay
        gameState={baseState({
          message: "wrong",
          clueHistory: { 0: { "2_0": "ocean", "3_0": "tentacles" } },
          invalidCluesHistory: { 0: ["2_0"] },
          guessHistory: { 0: "squid" },
        })}
        playerNames={PLAYER_NAMES}
      />,
    );
    expect(screen.getByText("octopus")).toBeInTheDocument();
    expect(screen.getByText("Maria guessed:")).toBeInTheDocument();
    expect(screen.getByText("squid")).toBeInTheDocument();
    const struck = document.querySelectorAll(".round-result-overlay__chip--struck");
    expect(struck).toHaveLength(1);
  });

  it("marks every chip struck on a 'duplicate' result", () => {
    render(
      <RoundResultOverlay
        gameState={baseState({
          message: "duplicate",
          clueHistory: { 0: { "2_0": "ocean", "3_0": "ocean" } },
          invalidCluesHistory: { 0: ["2_0", "3_0"] },
          guessHistory: { 0: null },
        })}
        playerNames={PLAYER_NAMES}
      />,
    );
    const struck = document.querySelectorAll(".round-result-overlay__chip--struck");
    expect(struck).toHaveLength(2);
    expect(screen.queryByText(/guessed:/i)).toBeNull();
  });

  it("shows the author name in each chip", () => {
    render(
      <RoundResultOverlay
        gameState={baseState({
          message: "pass",
          clueHistory: { 0: { "2_0": "ocean", "3_0": "tentacles" } },
          invalidCluesHistory: { 0: [] },
          guessHistory: { 0: null },
        })}
        playerNames={PLAYER_NAMES}
      />,
    );
    expect(screen.getByText(/João/)).toBeInTheDocument();
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
  });

  it("auto-dismisses after 8000ms", () => {
    const onVisibilityChange = vi.fn();
    render(
      <RoundResultOverlay
        gameState={baseState({
          message: "right",
          clueHistory: { 0: {} },
          invalidCluesHistory: { 0: [] },
          guessHistory: { 0: null },
        })}
        playerNames={PLAYER_NAMES}
        onVisibilityChange={onVisibilityChange}
      />,
    );
    expect(document.querySelector(".round-result-overlay")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(7999);
    });
    expect(document.querySelector(".round-result-overlay")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(document.querySelector(".round-result-overlay")).toBeNull();
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });
});
