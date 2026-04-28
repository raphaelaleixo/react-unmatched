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
- Persistence across multiple games in the same session — the feature is initial-lobby-only. The room's daily DB sweep handles cleanup.
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
| Architecture | Embed in react-gameroom's `RoomConfig` (`state.config.customWords`) | User owns the lib; piggybacks on the existing `useFirebaseRoom` listener with no new subscription. |

## Architecture

### Data model

`customWords` is added as an optional field on react-gameroom's `RoomConfig`:

```ts
RoomConfig {
  minPlayers: number;
  maxPlayers: number;
  requireFull: boolean;
  customWords?: string[]; // new — absent until host submits
}
```

In Firebase: `rooms/{roomId}/state.config.customWords` — array of strings, or absent. `deserializeRoom` in react-gameroom must pass the field through.

### Read path (big screen)

`useFirebaseRoom` already subscribes to `rooms/{roomId}/state` and produces `roomState`. The lobby reads `roomState.config.customWords` directly — no additional listener.

### Write path (upload page)

The upload page does a one-shot read of `state` (`get(ref(db, 'rooms/{roomId}/state'))`) to:

1. Verify the room exists.
2. Detect `state.status === "started"` and short-circuit to the "already in progress" view.
3. Pre-fill the textarea from `state.config.customWords` if present.

On submit, it writes the full `state.config` back (preserving `minPlayers`, `maxPlayers`, `requireFull`) with `customWords` updated. No live subscription.

The read-modify-write race with other lobby writes is theoretically possible but ignored — lobby state changes are human-initiated seconds apart.

### Game start

`LobbyPage`'s `onStart` handler chooses the word source:

- If `roomState.config.customWords` exists and `length >= 13`, shuffle them and slice to exactly 13. (If the host submitted more than 13, the extras are dropped at game start — submitting >13 is allowed and gives randomization across games.)
- Otherwise call `pickWords(lang, 13)` as today.

A new helper `getGameWords(config, lang)` in `gameHelpers.ts` encapsulates this branch and keeps `pickWords` pure.

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

- New `getGameWords(config: RoomConfig, lang: "en" | "pt_br"): string[]`.
- New pure helpers (extracted for testability):
  - `parseWordList(raw: string): string[]` — splits on newlines/commas, trims, drops empties.
  - `findDuplicates(words: string[]): string[]` — returns the duplicated values (case-insensitive comparison).

### react-gameroom changes

- `RoomConfig` type gains `customWords?: string[]`.
- `deserializeRoom` passes the field through to the deserialized config.
- Any default-config builder in the lib must keep the field as `undefined` when not provided (not `[]`).
- Bump `package.json` dependency from `^0.10.0` to the new version (`^0.11.x` or whatever the bump produces).

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
5. The phone writes the full `state.config` back to Firebase with `customWords` populated.
6. The big screen's existing `useFirebaseRoom` listener fires; `LobbyPage` re-renders.
7. The status chip appears: `✓ 13 custom words loaded`. The host has visual confirmation.
8. Host closes the modal manually. Re-opening lets them re-scan and edit (textarea pre-filled).
9. Host clicks Start Game. `onStart` reads `roomState.config.customWords` via `getGameWords`, uses it if present and ≥13, else falls back to `pickWords`.
10. Game proceeds normally. `customWords` remains under `state.config` until the daily DB sweep.

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

- Decide whether the react-gameroom bump is a separate PR or included in the same change.
- Pick exact i18n keys for the new strings (en + pt_br).
- Decide CSS placement (extend `lobby.css` for chip + button styles, or co-locate in a new module).
