# Custom Word Upload — Design

**Date:** 2026-04-28
**Status:** Approved (pending implementation plan)

## Summary

Allow the host of a newly created room to upload a custom list of words for the upcoming game. Words are entered privately on the host's phone via a QR code shown in the lobby modal, so they aren't revealed on the big screen. If a list is uploaded, it replaces the default word pool for that game; otherwise the game falls back to the existing random pick from `words.ts` / `words_pt_br.ts`.

## Goals

- Host can paste a custom word list (≥13 words) before starting the game.
- Words are entered out-of-sight of other players in the room.
- The feature is fully optional — if skipped, the current behavior is unchanged.
- The host can edit the list before clicking Start.
- The big screen confirms (without leaking the words) that the list was received.

## Non-Goals

- File uploads (`.txt`, `.csv`) — paste only.
- Mixing custom words with defaults — replacement only. (If <13 words are pasted, the input is rejected, not topped up.)
- Persistence across multiple games in the same session — the feature is initial-lobby-only. The `game` subtree (including `customWords`) is overwritten when Start is clicked, and the room's daily DB sweep handles longer-term cleanup.
- Authentication / host identity — anyone with the room code can hit the upload page. Trust physical proximity (the QR is only shown on the big-screen modal).
- Profanity filters, language detection, per-word character or length limits.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Input method | Textarea on a host-facing page | Simpler than file upload; faster to use on a phone. |
| Default-list interaction | Replace entirely | The default list is gigantic — mixing would be noise. |
| Minimum count | Hard minimum of 13, reject if fewer | 13 is a hard game-mechanic number. |
| When available | Initial lobby only | Matches current single-game-per-room flow. |
| Identity / access | Open route, no auth | Party-game context — proximity is sufficient. |
| Required vs optional | Optional, falls back to defaults | Don't break the existing fast path. |
| Paste format | Split on newlines AND commas | Most flexible for paste-from-anywhere. |
| Duplicates | Detect (case-insensitive); warn and prevent submit | Prevents silent dedup confusion. |
| Case normalization | None — UI uppercases displayed words anyway | No need to mutate input. |
| Multi-word entries | Allowed | E.g., "ice cream" is a valid word. |
| Per-word limits | None | YAGNI. |
| Re-edit flow | Re-opening the page pre-fills the textarea with the current list | Lets host fix typos / add words. |
| Language interaction | Game's `lang` setting is independent of word content | Host might mix English and Portuguese; UI strings still follow `lang`. |
| Lobby UI | Small "Add custom words" secondary button + status chip | Start Game stays the primary CTA. |
| Game-already-started edge | Show "game already in progress" message + back-home button | Same pattern as existing fallbacks. |
| Room-not-found edge | Reuse standard room-not-found page | Consistent with `LobbyPage`. |
| Cleanup | None — words stay under `state.config` | Daily DB sweep handles it. |
| Architecture | Store at `rooms/{roomId}/game/customWords` (alongside other game data) | Avoids any react-gameroom lib changes; piggybacks on the existing `useGameState` subscription with no new listener. |

## Architecture

### Data model

`customWords` is stored at the Firebase path `rooms/{roomId}/game/customWords` — an array of strings, or absent until the host submits. This sits alongside the other game-time fields (`words`, `round`, `phase`, `lang`, etc.) under the same `game` subtree.

The consumer's `GameState` interface in `useGameState.ts` gains an optional `customWords?: string[]` field, and the snapshot deserializer reads `data.customWords ?? undefined`. **No changes to react-gameroom are needed.**

### Read path (big screen)

`useGameState` already subscribes to `rooms/{roomId}/game` and produces a typed `GameState`. The lobby reads `gameState.customWords` directly — no additional listener.

### Write path (upload page)

The upload page does a one-shot read of the entire room (`get(ref(db, 'rooms/{roomId}'))`) to:

1. Verify the room exists (`value.state` is present).
2. Detect `value.state.status === "started"` and short-circuit to the "already in progress" view.
3. Pre-fill the textarea from `value.game?.customWords` if present.

On submit, it writes the leaf path: `set(ref(db, 'rooms/{roomId}/game/customWords'), parsed)`. No read-modify-write, no race window.

### Game start

`LobbyPage`'s `onStart` handler chooses the word source:

- If `gameState.customWords` exists and `length >= 13`, shuffle them and slice to exactly 13. (If the host submitted more than 13, the extras are dropped at game start — submitting >13 is allowed and gives randomization across games.)
- Otherwise call `pickWords(lang, 13)` as today.

A new helper `getGameWords(customWords, lang)` in `gameHelpers.ts` encapsulates this branch and keeps `pickWords` pure.

The existing `set(ref(db, 'rooms/{id}/game'), { words, round, ... })` in `onStart` overwrites the entire `game` subtree, which incidentally clears `customWords` from Firebase at game start. That's fine — they've already been consumed by `getGameWords`.

## Routes & Components

### New route in `App.tsx`

```tsx
<Route path="/room/:roomId/add-words" element={<PageTransition><AddWordsPage /></PageTransition>} />
```

Placed before the `/room/:roomId/*` fallback so it matches first.

### New page: `src/pages/AddWordsPage.tsx`

- One-shot fetch of room state on mount.
- Three render states: room-not-found, game-already-started, upload form.
- Upload form contents:
  - Header (title + room code).
  - Short instructions.
  - Textarea (auto-focused; if a list already exists, pre-filled with one word per line — `customWords.join("\n")`).
  - Live counter (`N / 13 words`, green at ≥13).
  - Inline warnings (duplicates list; under-13 message).
  - Submit button (label: "Send to lobby"; disabled until ≥13 unique).
- Post-submit confirmation card with "Edit list" and "Done" actions.
- All strings via `react-i18next`.

### New component: `src/components/AddWordsModal.tsx`

- Used only by `LobbyPage`.
- Renders `RoomQRCode` pointed at `${origin}/room/${roomId}/add-words`.
- Shows the URL as text below for fallback typing.
- Includes a short hint ("Open this on your phone to add words privately") and a close button.
- Closes on backdrop click or close button.

### New component: `src/components/CustomWordsStatus.tsx`

- Renders nothing if `customWords` is absent or `length < 13`.
- Otherwise renders a small chip: `✓ {count} custom words loaded`.
- May be inlined in `LobbyPage` if it stays under ~10 lines.

### Modified: `src/pages/LobbyPage.tsx`

- Imports `AddWordsModal` and `CustomWordsStatus`.
- Adds modal open/closed state.
- Renders the small "+ Add custom words" secondary button in `lobby__actions`, below `StartGameButton`.
- Renders the status chip near the Start button.
- `onStart` calls `getGameWords(roomState.config, lang)` instead of `pickWords(lang, 13)` directly.

### Modified: `src/helpers/gameHelpers.ts`

- New `getGameWords(customWords: string[] | undefined, lang: "en" | "pt_br"): string[]`.
- New pure helpers (extracted for testability):
  - `parseWordList(raw: string): string[]` — splits on newlines/commas, trims, drops empties.
  - `findDuplicates(words: string[]): string[]` — returns the duplicated values (case-insensitive comparison).

### Modified: `src/hooks/useGameState.ts`

- `GameState` interface gains `customWords?: string[]`.
- `INITIAL_STATE` adds `customWords: undefined`.
- The snapshot deserializer reads `customWords: data.customWords ?? undefined`.

### react-gameroom changes

None. The custom-words feature lives entirely inside the consumer app.

## Lobby UI

```
┌───────────────────────────────────┐
│  3 / 8 players (min 3)            │
│                                   │
│  [  Start Game  ]  ← primary CTA  │
│                                   │
│  + Add custom words   ← small     │
│                                   │
│  ✓ 13 custom words loaded   ← chip│
│    (only when present)            │
└───────────────────────────────────┘
```

## Data Flow (full lifecycle)

1. Host clicks "+ Add custom words" on the lobby. Modal opens with QR.
2. Host scans the QR on their phone, loading `/room/{code}/add-words`.
3. The phone fetches `state` once and renders the upload form (empty on first visit).
4. Host pastes/edits words and clicks Send. Submit is disabled until ≥13 unique words.
5. The phone writes the leaf path `rooms/{roomId}/game/customWords` to Firebase.
6. The big screen's existing `useGameState` listener fires; `LobbyPage` re-renders.
7. The status chip appears: `✓ 13 custom words loaded`. The host has visual confirmation.
8. Host closes the modal manually. Re-opening lets them re-scan and edit (textarea pre-filled from `game.customWords`).
9. Host clicks Start Game. `onStart` reads `gameState.customWords`, passes it through `getGameWords`, uses the custom list if present and ≥13, else falls back to `pickWords`.
10. The Start handler's `set(ref(db, 'rooms/{id}/game'), { words, ... })` overwrites the `game` subtree, which incidentally clears `customWords` from Firebase. The chosen 13 are persisted under `game.words`.

## Error Handling

- **Firebase read fails on upload page:** standard error UI with retry.
- **Firebase write fails on submit:** inline error message; submit button re-enabled.
- **Network offline at submit:** rely on Firebase SDK's default queueing / error surface.
- **Room not found:** reuse the existing room-not-found UI from `LobbyPage`.
- **Game already started:** dedicated message + back-home button.

No defensive validation for `customWords` being `null` vs `undefined` vs `[]` — the design picks one shape (absent or `string[]` with length ≥ 13) and trusts it.

## Testing

### Unit tests (Vitest)

- `gameHelpers.test.ts`:
  - `getGameWords` returns a 13-item shuffled subset of `customWords` when present.
  - `getGameWords` falls back to `pickWords` when `customWords` is absent.
  - `getGameWords` slices to exactly 13 even if input has more.
  - `parseWordList` splits on newlines and commas, trims, drops empties.
  - `findDuplicates` detects duplicates case-insensitively.

### Component tests

- `AddWordsPage`:
  - Submit button disabled when count < 13.
  - Duplicate warning shown for repeated entries.
  - Success view shown after a mocked successful submit.

### Skipped (per project conventions)

- `AddWordsModal` (just renders QR + close).
- `CustomWordsStatus` (just renders count).
- `LobbyPage` integration — covered by manual smoke test.

### Manual smoke test (in browser)

1. Create room on big screen.
2. Click "+ Add custom words" → QR shows in modal.
3. Open `/room/{code}/add-words` in another tab → submit 13 words.
4. Big screen chip updates live to `✓ 13 custom words loaded`.
5. Re-open the upload page → textarea pre-filled.
6. Click Start Game → game uses uploaded words (verify in Firebase console or by playing through).
7. Skip the upload entirely → game falls back to defaults (regression check).
8. Visit `/add-words` after Start → "game already in progress" message.
9. Visit `/add-words` for a nonexistent room → standard not-found page.

## Open Items for the Implementation Plan

- Pick exact i18n keys for the new strings (en + pt_br).
- Decide CSS placement (extend `index.css` for chip + button styles, or co-locate in a new module).
