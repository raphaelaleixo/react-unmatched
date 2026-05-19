# Result Overlay: Clues + Wrong Guess

## Motivation

After playing a full game, the round-result overlay feels under-informative.
The non-guessing players know the secret word once it appears, but they don't
get to see what the guesser actually saw — which clues survived filtering,
which were struck out, and (when the guess was wrong) what the guesser ended
up saying. That context is the most interesting part of the post-round table
talk, and it currently disappears the moment the overlay fires.

## Goal

Enrich the round-result overlay so that, for every result type, players can
see the clue trail the guesser worked from; and for **wrong** specifically,
the guess itself.

## Scope

In scope:
- Adding a clue list (with author names + struck/valid distinction) to the
  overlay for **right**, **wrong**, **pass**, and **duplicate** results.
- Adding a "[Guesser] guessed: [text]" line to the overlay for **wrong**.
- Extending per-round history in Firebase so the overlay has the data it
  needs after the round-end transition clears live state.
- Bumping the auto-dismiss timer from 4s to 8s to accommodate the extra
  reading.
- Updating CSS for the new layout, including responsive wrapping for phone
  vs. big-screen widths.

Out of scope:
- Manual dismiss / tap-to-extend interactions.
- Surfacing the clue history outside of the immediate post-round overlay
  (e.g. on a score summary).
- Any change to gameplay logic, scoring, or phase transitions.

## Data model

Today, `buildNextRoundUpdate` (in `src/helpers/gameHelpers.ts`) writes the
secret word and `clueHistory/{round}` at round end and **clears** `guess`,
`clues`, `invalidClues`, and `validClues`. The overlay therefore has no
access to the guess or the struck/valid split once it renders.

We add two parallel per-round history records under `rooms/{id}/game`:

- `invalidCluesHistory/{round}: string[]` — the struck clue keys (same shape
  as the live `invalidClues` array). For **right**, this may be empty if no
  clues were filtered; for **duplicate**, it contains every clue key.
- `guessHistory/{round}: string | null` — the guess text for **wrong**/**right**
  (when a guess was actually submitted), `null` for **pass**/**duplicate**.

Both are written at the round-end transition points:

1. `useGameState` clue→duplicate auto-pass — all clue keys go into
   `invalidCluesHistory`; `guessHistory` is `null`. Writes `clueHistory`
   today.
2. `useGameState` validate→right auto-transition — the current
   `state.invalidClues` and `state.guess` are captured before being nulled.
   Writes `clueHistory` today.
3. `FilterClues` all-struck branch — the new struck set goes into
   `invalidCluesHistory`; `guessHistory` is `null`. Writes `clueHistory`
   today.
4. `ValidateAnswer.handleResult` (right/wrong) — `props.invalidClues` and
   `props.guess` are captured. Writes `clueHistory` today.
5. `MakeGuess.handlePass` — `props.clues` and `props.invalidClues` are
   captured; `guessHistory` is `null`. **Does not write `clueHistory`
   today** — this call site currently passes empty extras to
   `buildNextRoundUpdate`, so pass rounds end up with no clue history. We
   start writing `clueHistory/{round}` here as part of this work, otherwise
   the new chip list would render empty for pass-via-guesser rounds.

`MakeGuess` and `ValidateAnswer` currently don't receive `clues` /
`invalidClues` as props — only `MakeGuess` gets `invalidCount`, and
`ValidateAnswer` already gets `clues`. We thread the missing ones down
from `PlayerPage` (which renders both components and already has
`gameState` in scope) so the transition calls have what they need.

The new fields are added to the `GameState` interface in
`src/hooks/useGameState.ts`:

```ts
invalidCluesHistory: Record<number, string[]>;
guessHistory: Record<number, string | null>;
```

Both default to `{}` when reading from Firebase, mirroring how
`clueHistory` is handled.

## Overlay behavior

Per result type:

| Result | Word | Guess line | Clue list |
|---|---|---|---|
| `right` | shown | hidden | shown (struck entries possible if any were filtered) |
| `wrong` | shown | `"[Guesser] guessed: [guess]"` | shown |
| `pass` | shown | hidden | shown |
| `duplicate` | shown | hidden | shown (every chip struck) |

The current `duplicate` headline (`result.duplicate` with the single hint
interpolated into the label) becomes redundant once the chip list shows the
duplicates explicitly with author names. The headline is simplified to a
plain "Everyone said the same thing" (new translation key
`result.duplicateSimple`, or rename of the existing key with the `{hint}`
interpolation removed).

The dismiss timer goes 4s → 8s.

## Layout

The overlay structure, top-down:

1. Result label (existing) — "RIGHT" / "WRONG" / "PASS" / etc.
2. Secret word in the existing large treatment.
3. **New**: guess line — only rendered when `message === "wrong"`. Format:
   `"[Guesser name] guessed: [guess]"`. Styled with the same accent color as
   the WRONG label so it visually pairs with it.
4. **New**: clue chip list — section header ("Clues") followed by chips, one
   per clue. Each chip shows `[clue text] — [author name]`. Struck chips get
   `text-decoration: line-through` plus reduced opacity.
5. Progress bar (existing).

Chip list container:

```css
display: flex;
flex-wrap: wrap;
justify-content: center;
gap: <existing spacing token>;
```

`flex-wrap: wrap` with `justify-content: center` covers both surfaces:
chips lay out side-by-side on the big screen, collapse to one-or-two per
row on a phone, and stay center-aligned in either case. No separate
breakpoint logic.

All new styles live under the existing `.round-result-overlay` block in
the CSS — new BEM modifiers, no new component file.

## Touched files

- `src/helpers/gameHelpers.ts` — extend `buildNextRoundUpdate` (or callers)
  to write `invalidCluesHistory/{round}` and `guessHistory/{round}`.
- `src/hooks/useGameState.ts` — extend `GameState` with the two new history
  fields; update the auto-correct transition to capture `state.invalidClues`
  and `state.guess` before nulling; update the duplicate auto-pass to write
  all clue keys into `invalidCluesHistory`.
- `src/components/RoundResultOverlay.tsx` — render the guess line for
  `wrong`; render the chip list from `clueHistory[round-1]`,
  `invalidCluesHistory[round-1]`, and `playerNames`; bump timer to 8000ms.
- `src/components/BigScreenGame.tsx` — pass `playerNames` to
  `RoundResultOverlay`.
- `src/pages/PlayerPage.tsx` — pass `clues` + `invalidClues` to `MakeGuess`,
  add `invalidClues` to `ValidateAnswer`, pass `playerNames` to
  `RoundResultOverlay`.
- `src/components/MakeGuess.tsx` — accept `clues` and `invalidClues` props;
  write `invalidCluesHistory` in `handlePass`.
- `src/components/ValidateAnswer.tsx` — accept `invalidClues` prop; write
  `invalidCluesHistory` and `guessHistory` in `handleResult`.
- `src/components/FilterClues.tsx` — write `invalidCluesHistory` in the
  all-struck pass branch.
- Existing `.round-result-overlay` CSS block — new modifiers for guess
  line, chip list, struck chip, section header.
- `src/locales/en.json` and `src/locales/pt_br.json` — new strings:
  `result.guessedBy` (e.g. `"{name} guessed: {guess}"`),
  `result.cluesHeader` (e.g. `"Clues"`); simplified
  `result.duplicateSimple` (e.g. `"Everyone said the same thing"`).

## Testing

- Unit-level test for `buildNextRoundUpdate` (or the call sites) confirming
  `invalidCluesHistory/{round}` and `guessHistory/{round}` are written
  correctly for each of the four transition paths.
- Component test for `RoundResultOverlay` covering:
  - `wrong` renders the guess line, chip list, and word.
  - `right` renders the chip list and word but no guess line.
  - `pass` renders the chip list and word but no guess line.
  - `duplicate` renders all chips struck and the simplified headline.
  - Auto-dismiss fires at 8000ms.
- Manual check on a phone-width viewport that chips wrap to multiple rows
  with center alignment intact.

## Open questions

None.
