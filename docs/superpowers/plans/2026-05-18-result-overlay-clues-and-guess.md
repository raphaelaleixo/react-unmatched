# Result Overlay: Clues + Wrong Guess Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the round-result overlay so it shows the clue trail (struck + valid, with author names) on every result type, plus a "[Guesser] guessed: …" line on wrong rounds. Auto-dismiss bumps from 4s → 8s.

**Architecture:** Three new per-round Firebase records (`invalidCluesHistory/{round}`, `guessHistory/{round}`, `guesserHistory/{round}`) capture the data that today's `buildNextRoundUpdate` would null out (or never recorded — round 0's guesser is picked at random in `LobbyPage`, so it can't be derived from the round number). `RoundResultOverlay` reads them alongside the existing `clueHistory` and renders chips per clue with author names. Same overlay component is shared by `BigScreenGame` (TV) and `PlayerPage` (phones); a single `flex-wrap` layout covers both surfaces.

**Tech Stack:** React 19 + TypeScript, Vite, Firebase RTDB, react-i18next, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-18-result-overlay-clues-and-guess-design.md`

---

### Task 1: Extend `buildNextRoundUpdate` and `GameState` with history records

**Files:**
- Modify: `src/helpers/gameHelpers.ts:158-175`
- Modify: `src/helpers/gameHelpers.test.ts` (add new describe block at end)
- Modify: `src/hooks/useGameState.ts:24-54, 72-87`

**Background:** Today `buildNextRoundUpdate(round, playerCount, message, extras?)` takes an open-shaped `extras` object that the four callers use to pass `{[`clueHistory/${round}`]: clues}`. We're replacing that with a structured `history?: { clues, invalidClues, guess, guesser }` param so all four round-end records are written in one place, and adding the three new records to the `GameState` interface so callers can read them.

- [ ] **Step 1: Write failing tests for the new `buildNextRoundUpdate` signature**

Append to `src/helpers/gameHelpers.test.ts` (also add `buildNextRoundUpdate` to the existing `import` block at the top of the file):

```ts
// Add to existing import:
//   import { ..., buildNextRoundUpdate } from "./gameHelpers";

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/helpers/gameHelpers.test.ts`
Expected: 4 failures in the new `buildNextRoundUpdate` describe block (signature doesn't yet accept the history object; new record keys aren't written).

- [ ] **Step 3: Update `buildNextRoundUpdate` signature and body**

Replace the function in `src/helpers/gameHelpers.ts` (currently lines 158-175) with:

```ts
/**
 * Build the Firebase update object that advances the game to the next round.
 *
 * Every round transition shares the same core fields (increment round, rotate
 * guesser, reset phase to "clue", clear transient data). Passing the optional
 * `history` argument also writes per-round history records used by the
 * round-result overlay (clues seen, which were struck, what was guessed).
 *
 * @param round       - the round that just ended (0-based)
 * @param playerCount - total active players (for guesser rotation)
 * @param message     - result type shown in the overlay ("right" | "wrong" | "pass" | "duplicate")
 * @param history     - optional snapshot of the round for the result overlay
 */
export function buildNextRoundUpdate(
  round: number,
  playerCount: number,
  message: string,
  history?: {
    clues: Record<string, string>;
    invalidClues: string[];
    guess: string | null;
    guesser: number;
  },
): Record<string, unknown> {
  const nextRound = round + 1;
  const base: Record<string, unknown> = {
    message,
    [`results/${round}`]: message === "duplicate" ? "pass" : message,
    round: nextRound,
    answering: getNextAnswering(nextRound, playerCount),
    phase: "clue",
    clues: null,
    guess: null,
  };
  if (history) {
    base[`clueHistory/${round}`] = history.clues;
    base[`invalidCluesHistory/${round}`] = history.invalidClues;
    base[`guessHistory/${round}`] = history.guess;
    base[`guesserHistory/${round}`] = history.guesser;
  }
  return base;
}
```

- [ ] **Step 4: Extend the `GameState` interface and the Firebase loader**

In `src/hooks/useGameState.ts`, update the interface (currently lines 24-38) to add three fields right after `clueHistory`:

```ts
  clueHistory: Record<number, Record<string, string>>;  // past rounds' clues (for overlay)
  invalidCluesHistory: Record<number, string[]>;        // past rounds' struck clue keys
  guessHistory: Record<number, string | null>;          // past rounds' submitted guesses
  guesserHistory: Record<number, number>;               // past rounds' guesser player IDs
  results: Record<number, "right" | "wrong" | "pass">;  // per-round outcomes
```

Add the same three fields to `INITIAL_STATE` (currently lines 40-54), defaulting to `{}`:

```ts
  clueHistory: {},
  invalidCluesHistory: {},
  guessHistory: {},
  guesserHistory: {},
  results: {},
```

And in the `onValue` handler (currently lines 72-87), default all three to `{}`:

```ts
        clueHistory: data.clueHistory ?? {},
        invalidCluesHistory: data.invalidCluesHistory ?? {},
        guessHistory: data.guessHistory ?? {},
        guesserHistory: data.guesserHistory ?? {},
        results: data.results ?? {},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/helpers/gameHelpers.test.ts`
Expected: all helper tests pass (including the 4 new ones).

Run: `npx tsc -b`
Expected: no type errors. (If callers still pass the old `extras` shape, this will fail — that's Task 2's job; if it fails now, abort and double-check Step 3 didn't break anything else.)

If `tsc` does fail because callers use the old `extras` shape (e.g. `{ [`clueHistory/${round}`]: clues }`), that's expected and confirms the signature change reached the callers. Move on — Task 2 fixes them.

- [ ] **Step 6: Commit**

```bash
git add src/helpers/gameHelpers.ts src/helpers/gameHelpers.test.ts src/hooks/useGameState.ts
git commit -m "feat(game): add per-round history records to round-end update"
```

---

### Task 2: Update all five round-end transition call sites to write history

**Files:**
- Modify: `src/hooks/useGameState.ts:110-122` (duplicate auto-pass)
- Modify: `src/hooks/useGameState.ts:128-144` (validate→right auto-transition)
- Modify: `src/components/FilterClues.tsx:19-87`
- Modify: `src/components/ValidateAnswer.tsx:16-46`
- Modify: `src/components/MakeGuess.tsx:14-49`
- Modify: `src/pages/PlayerPage.tsx:180-244`

**Background:** Five places call `buildNextRoundUpdate` at round end. Four of them already pass a clue map (just under the old `extras` shape) and need to switch to the new `history` shape. The fifth — `MakeGuess.handlePass` — passes no extras today, so pass-via-guesser rounds currently lose their clue history; we start writing it. The two `useGameState` sites read `state.answering` directly for the `guesser` field. The three component sites (`FilterClues`, `MakeGuess`, `ValidateAnswer`) need new props threaded down from `PlayerPage` (which has `gameState.answering` in scope): `clues` / `invalidClues` for whoever doesn't already get them, and `guesserId` for all three.

There are no unit tests for these sites; the type system + the manual smoke check at the end of the task are the safety net. The component-level tests come in Task 4.

- [ ] **Step 1: Update `useGameState` duplicate auto-pass branch**

In `src/hooks/useGameState.ts`, replace the duplicate-pass `update(...)` call (currently lines 110-118) with:

```ts
    if (allSame) {
      // Every clue is the same word — auto-pass and show "duplicate" overlay
      const invalidKeys = Object.keys(state.clues);
      update(ref(db, `rooms/${roomId}/game`), {
        ...buildNextRoundUpdate(state.round, playerCount, "duplicate", {
          clues: state.clues,
          invalidClues: invalidKeys,
          guess: null,
          guesser: state.answering,
        }),
        invalidClues: invalidKeys,
        validClues: [],
      });
    } else {
```

- [ ] **Step 2: Update `useGameState` validate→right auto-transition**

Replace the `update(...)` call (currently lines 137-143) with:

```ts
    update(ref(db, `rooms/${roomId}/game`), {
      ...buildNextRoundUpdate(state.round, playerCount, "right", {
        clues: state.clues,
        invalidClues: state.invalidClues,
        guess: state.guess,
        guesser: state.answering,
      }),
      invalidClues: null,
      validClues: null,
    });
```

- [ ] **Step 3: Add `guesserId` prop to `FilterClues` and update its all-struck pass**

In `src/components/FilterClues.tsx`:

Add `guesserId: number` to the props interface (currently lines 19-26):

```ts
interface FilterCluesProps {
  roomId: string;
  clues: Record<string, string>;
  playerNames: Record<number, string>;
  playerCount: number;
  round: number;
  word: string;
  guesserId: number;
}
```

Destructure it (currently lines 28-36):

```ts
export default function FilterClues({
  roomId,
  clues,
  playerNames,
  playerCount,
  round,
  word,
  guesserId,
}: FilterCluesProps) {
```

Replace the all-struck branch (currently lines 70-79) with:

```ts
    // All clues struck → skip guess phase, count as a pass
    if (validClues.length === 0) {
      await update(ref(db, `rooms/${roomId}/game`), {
        ...buildNextRoundUpdate(round, playerCount, "pass", {
          clues,
          invalidClues,
          guess: null,
          guesser: guesserId,
        }),
        invalidClues,
        validClues,
      });
      return;
    }
```

- [ ] **Step 4: Update `ValidateAnswer` to accept `invalidClues` + `guesserId` and write history**

In `src/components/ValidateAnswer.tsx`:

Add `invalidClues: string[]` and `guesserId: number` to the props interface (currently lines 16-24):

```ts
interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
  guesserName: string;
  guesserId: number;
  clues: Record<string, string>;
  invalidClues: string[];
  playerCount: number;
  round: number;
}
```

Destructure them (currently lines 26-34):

```ts
export default function ValidateAnswer({
  roomId,
  guess,
  word,
  guesserName,
  guesserId,
  clues,
  invalidClues,
  playerCount,
  round,
}: ValidateAnswerProps) {
```

Replace the `handleResult` body (currently lines 38-46) with:

```ts
  /** Record the result and advance to the next round. */
  async function handleResult(result: "right" | "wrong") {
    await update(ref(db, `rooms/${roomId}/game`), {
      ...buildNextRoundUpdate(round, playerCount, result, {
        clues,
        invalidClues,
        guess,
        guesser: guesserId,
      }),
      invalidClues: null,
      validClues: null,
    });
  }
```

- [ ] **Step 5: Update `MakeGuess` to accept `clues` + `invalidClues` + `guesserId` and start writing history**

In `src/components/MakeGuess.tsx`:

Add the three new props to the interface (currently lines 14-20):

```ts
interface MakeGuessProps {
  roomId: string;
  validClues: string[];
  clues: Record<string, string>;
  invalidClues: string[];
  invalidCount: number;
  playerCount: number;
  round: number;
  guesserId: number;
}
```

Destructure them (currently lines 22-28):

```ts
export default function MakeGuess({
  roomId,
  validClues,
  clues,
  invalidClues,
  invalidCount,
  playerCount,
  round,
  guesserId,
}: MakeGuessProps) {
```

Replace `handlePass` (currently lines 43-49) with:

```ts
  /** Skip this round — no penalty, advance to next round. */
  async function handlePass() {
    await update(ref(db, `rooms/${roomId}/game`), {
      ...buildNextRoundUpdate(round, playerCount, "pass", {
        clues,
        invalidClues,
        guess: null,
        guesser: guesserId,
      }),
      invalidClues: null,
      validClues: null,
    });
  }
```

- [ ] **Step 6: Thread the new props through `PlayerPage`**

In `src/pages/PlayerPage.tsx`, update the `<FilterClues>` render (currently lines 180-188) to pass `guesserId`:

```tsx
          return (
            <FilterClues
              roomId={roomId!}
              clues={gameState.clues}
              playerNames={playerNames}
              playerCount={playerCount}
              round={gameState.round}
              word={gameState.words[gameState.round]}
              guesserId={gameState.answering}
            />
          );
```

Update the `<MakeGuess>` render (currently lines 207-215) to pass `clues` + `invalidClues` + `guesserId`:

```tsx
        if (isAnswering) {
          return (
            <MakeGuess
              roomId={roomId!}
              validClues={gameState.validClues}
              clues={gameState.clues}
              invalidClues={gameState.invalidClues}
              invalidCount={gameState.invalidClues.length}
              playerCount={playerCount}
              round={gameState.round}
              guesserId={gameState.answering}
            />
          );
        }
```

And update the `<ValidateAnswer>` render (currently lines 234-243) to pass `invalidClues` + `guesserId`:

```tsx
          return (
            <ValidateAnswer
              roomId={roomId!}
              guess={gameState.guess!}
              word={gameState.words[gameState.round]}
              guesserName={nameOf(gameState.answering)}
              guesserId={gameState.answering}
              clues={gameState.clues}
              invalidClues={gameState.invalidClues}
              playerCount={playerCount}
              round={gameState.round}
            />
          );
```

- [ ] **Step 7: Type-check and run all tests**

Run: `npx tsc -b`
Expected: no type errors.

Run: `npx vitest run`
Expected: all existing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useGameState.ts src/components/FilterClues.tsx src/components/ValidateAnswer.tsx src/components/MakeGuess.tsx src/pages/PlayerPage.tsx
git commit -m "feat(game): write invalidCluesHistory and guessHistory at every round end"
```

---

### Task 3: Add i18n strings

**Files:**
- Modify: `src/locales/en.json:171-177` (the `result.*` block)
- Modify: `src/locales/pt_br.json` (the matching `result.*` block)

**Background:** The overlay needs three new strings: the "guessed:" line, the "Clues" section header, and a simplified duplicate label (since the chip list now shows the duplicate clues explicitly with author names — interpolating the hint into the label is redundant).

- [ ] **Step 1: Add the new keys to `en.json`**

Replace the `result` block in `src/locales/en.json` (currently lines 171-177) with:

```json
  "result": {
    "right": "Well done!",
    "wrong": "Bummer!",
    "pass": "Passed...",
    "duplicate": "Everyone said the same thing",
    "theWord": "The word was",
    "guessedBy": "{{name}} guessed:",
    "cluesHeader": "Clues"
  },
```

Note: the existing `result.duplicate` key drops its `{{hint}}` interpolation — the value is now a static "Everyone said the same thing" string. The chip list shows the actual duplicate text below it.

- [ ] **Step 2: Add the matching keys to `pt_br.json`**

Find the `result` block in `src/locales/pt_br.json` and apply the same three additions / one edit:

```json
  "result": {
    "right": "<existing pt_br value>",
    "wrong": "<existing pt_br value>",
    "pass": "<existing pt_br value>",
    "duplicate": "Todos disseram a mesma coisa",
    "theWord": "<existing pt_br value>",
    "guessedBy": "{{name}} chutou:",
    "cluesHeader": "Dicas"
  },
```

Open `pt_br.json` first and preserve the existing translated values for `right` / `wrong` / `pass` / `theWord`; only the new keys and the rewritten `duplicate` value need changing.

- [ ] **Step 3: Type-check (ensures no JSON syntax breakage)**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/pt_br.json
git commit -m "i18n(result): add guessedBy + cluesHeader, simplify duplicate label"
```

---

### Task 4: Rewrite `RoundResultOverlay` to render the guess line and chip list

**Files:**
- Modify: `src/components/RoundResultOverlay.tsx` (full rewrite)
- Create: `src/components/RoundResultOverlay.test.tsx`

**Background:** This is the core user-visible change. The overlay now:
1. Accepts a `playerNames` prop.
2. Renders a guess line ("[Guesser] guessed: [text]") only on `wrong`.
3. Renders a chip per clue: text + author name; struck clues get a struck modifier.
4. Bumps auto-dismiss from 4000ms to 8000ms.

The guesser-name lookup reads `gameState.guesserHistory[finishedRound]` (written by Task 2) — derivation from round numbers doesn't work because round 0's guesser is random.

- [ ] **Step 1: Write the failing component test file**

Create `src/components/RoundResultOverlay.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/RoundResultOverlay.test.tsx`
Expected: all six tests fail (component doesn't accept `playerNames`, doesn't render chips or the guess line, still dismisses at 4000ms).

- [ ] **Step 3: Rewrite `RoundResultOverlay`**

Replace the contents of `src/components/RoundResultOverlay.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameState } from "../hooks/useGameState";
import { parseClueKey } from "../helpers/gameHelpers";

interface RoundResultOverlayProps {
  gameState: GameState;
  playerNames: Record<number, string>;
  onVisibilityChange?: (visible: boolean) => void;
}

const DISMISS_MS = 8000;

export default function RoundResultOverlay({
  gameState,
  playerNames,
  onVisibilityChange,
}: RoundResultOverlayProps) {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (gameState.message) {
      setShowResult(true);
      onVisibilityChange?.(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onVisibilityChange?.(false);
      }, DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [gameState.message, gameState.round]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showResult || !gameState.message) return null;

  const finishedRound = gameState.round - 1;
  const word = gameState.words[finishedRound];
  const clues = gameState.clueHistory[finishedRound] ?? {};
  const invalidKeys = new Set(gameState.invalidCluesHistory[finishedRound] ?? []);
  const guess = gameState.guessHistory[finishedRound] ?? null;
  const guesserId = gameState.guesserHistory[finishedRound] ?? 0;
  const guesserName = playerNames[guesserId] ?? "";

  const clueEntries = Object.entries(clues).map(([key, text]) => {
    const { playerId } = parseClueKey(key);
    return {
      key,
      text,
      author: playerNames[playerId] ?? `Player ${playerId}`,
      struck: invalidKeys.has(key),
    };
  });

  return (
    <div className={`round-result-overlay round-result-overlay--${gameState.message}`}>
      <div className="round-result-overlay__content">
        <p className="round-result-overlay__label">
          {t(`result.${gameState.message}`)}
        </p>

        <div className="round-result-overlay__word">
          <span className="round-result-overlay__word-label">
            {t("result.theWord")}
          </span>
          <span className="round-result-overlay__word-text">{word}</span>
        </div>

        {gameState.message === "wrong" && guess && (
          <p className="round-result-overlay__guess">
            <span className="round-result-overlay__guess-label">
              {t("result.guessedBy", { name: guesserName })}
            </span>{" "}
            <span className="round-result-overlay__guess-text">{guess}</span>
          </p>
        )}

        {clueEntries.length > 0 && (
          <div className="round-result-overlay__clues">
            <p className="round-result-overlay__clues-header">
              {t("result.cluesHeader")}
            </p>
            <div className="round-result-overlay__chips">
              {clueEntries.map(({ key, text, author, struck }) => (
                <span
                  key={key}
                  className={`round-result-overlay__chip${struck ? " round-result-overlay__chip--struck" : ""}`}
                >
                  <span className="round-result-overlay__chip-text">{text}</span>
                  <span className="round-result-overlay__chip-author"> — {author}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="round-result-overlay__progress">
          <div className="round-result-overlay__progress-bar" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run: `npx vitest run src/components/RoundResultOverlay.test.tsx`
Expected: all six tests pass.

If the helper tests broke as collateral, also run: `npx vitest run`
Expected: full suite green.

- [ ] **Step 5: Type-check**

Run: `npx tsc -b`
Expected: type errors at the two `<RoundResultOverlay>` call sites (`BigScreenGame.tsx`, `PlayerPage.tsx`) because they don't pass `playerNames` yet. That's expected — Task 5 wires them.

- [ ] **Step 6: Commit**

```bash
git add src/components/RoundResultOverlay.tsx src/components/RoundResultOverlay.test.tsx
git commit -m "feat(overlay): render clue chips + wrong-guess line, 8s dismiss"
```

---

### Task 5: Wire `playerNames` through the two render sites + update overlay CSS

**Files:**
- Modify: `src/components/BigScreenGame.tsx:180`
- Modify: `src/pages/PlayerPage.tsx:291`
- Modify: `src/styles/index.css:1044-1180` (the `.round-result-overlay` block + responsive override)

**Background:** Both call sites already have `playerNames` in scope (`BigScreenGame` via props, `PlayerPage` via `derived.playerNames`); they just need to pass it through. The CSS adds modifiers for the guess line, the "Clues" section header, the chip list (`flex-wrap` with center alignment), the chip itself, and the struck-chip styling. The progress-bar animation goes 4s → 8s.

- [ ] **Step 1: Pass `playerNames` from `BigScreenGame`**

In `src/components/BigScreenGame.tsx` at line 180, replace:

```tsx
      <RoundResultOverlay gameState={gameState} />
```

with:

```tsx
      <RoundResultOverlay gameState={gameState} playerNames={playerNames} />
```

- [ ] **Step 2: Pass `playerNames` from `PlayerPage`**

In `src/pages/PlayerPage.tsx` at line 291, replace:

```tsx
          <RoundResultOverlay gameState={gameState} onVisibilityChange={handleOverlayVisibility} />
```

with:

```tsx
          <RoundResultOverlay
            gameState={gameState}
            playerNames={playerNames}
            onVisibilityChange={handleOverlayVisibility}
          />
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no type errors.

- [ ] **Step 4: Bump the progress-bar animation to 8s**

In `src/styles/index.css` line 1122, change:

```css
  animation: progressShrink 4s linear forwards;
```

to:

```css
  animation: progressShrink 8s linear forwards;
```

- [ ] **Step 5: Add CSS for the guess line, chip list, and chips**

In `src/styles/index.css`, immediately AFTER the `.round-result-overlay__word-text` block (currently ends at line 1107) and BEFORE the `.round-result-overlay__progress` block (currently starts at line 1109), insert:

```css
.round-result-overlay__guess {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  font-size: clamp(0.95rem, 2.2vw, 1.25rem);
  animation: resultFadeIn 0.5s ease-out 0.35s both;
}

.round-result-overlay__guess-label {
  color: var(--color-text-muted);
}

.round-result-overlay__guess-text {
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-red);
  letter-spacing: 0.03em;
}

.round-result-overlay__clues {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: min(90vw, 56rem);
  animation: resultFadeIn 0.5s ease-out 0.45s both;
}

.round-result-overlay__clues-header {
  margin: 0;
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.round-result-overlay__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 0.75rem;
}

.round-result-overlay__chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.15rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: clamp(0.85rem, 1.8vw, 1rem);
  color: var(--color-text);
}

.round-result-overlay__chip-text {
  font-weight: 600;
}

.round-result-overlay__chip-author {
  color: var(--color-text-muted);
  font-weight: 400;
}

.round-result-overlay__chip--struck {
  opacity: 0.5;
}

.round-result-overlay__chip--struck .round-result-overlay__chip-text,
.round-result-overlay__chip--struck .round-result-overlay__chip-author {
  text-decoration: line-through;
}
```

- [ ] **Step 6: Bump desktop chip sizing in the responsive block**

In `src/styles/index.css`, inside the `@media (min-width: 1024px)` block that currently ends around line 1180 (after the `.round-result-overlay__progress` override), add the following overrides before the closing `}`:

```css
  .round-result-overlay__guess {
    font-size: clamp(1.1rem, 2.5vw, 1.5rem);
    gap: 0.625rem;
  }

  .round-result-overlay__clues-header {
    font-size: clamp(0.875rem, 1.875vw, 1.0625rem);
  }

  .round-result-overlay__chips {
    gap: 0.625rem 1rem;
  }

  .round-result-overlay__chip {
    padding: 0.5rem 1rem;
    font-size: clamp(1rem, 2vw, 1.25rem);
  }
```

- [ ] **Step 7: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass (helpers + overlay + existing).

Run: `npx tsc -b && npx vite build`
Expected: clean build.

- [ ] **Step 8: Manual smoke test**

Start the dev server: `npm run dev` (note: `--host` is in the script so phones on the same Wi-Fi can connect).

Manually verify on the big screen + at least one phone:
- A **wrong** round overlays the word, "[Guesser] guessed: [their guess]" in red, and the chip list with struck/valid distinction.
- A **right** round overlays the word + chips, no guess line.
- A **pass** round (guesser presses Pass on the phone) shows chips.
- A **duplicate** round (all hinters submit the same word) shows the simplified "Everyone said the same thing" label + all chips struck.
- The overlay stays visible for ~8 seconds.
- On a phone-width viewport the chips wrap to multiple rows, center-aligned.

If any of those fail, fix before committing.

- [ ] **Step 9: Commit**

```bash
git add src/components/BigScreenGame.tsx src/pages/PlayerPage.tsx src/styles/index.css
git commit -m "feat(overlay): wire playerNames + style the chip list and guess line"
```
