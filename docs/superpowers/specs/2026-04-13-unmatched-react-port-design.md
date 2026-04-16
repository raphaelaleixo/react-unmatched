# Unmatched — React Port Design Spec

A React port of the "Unmatched" cooperative word-guessing game (based on Just One by Ludovic Roudy and Bruno Sautter), using the `react-gameroom` library for lobby management.

## Overview

Unmatched is a cooperative party game for 4-8 players. Each round, one player guesses a secret word using one-word clues from the other players. Duplicate clues are removed before the guesser sees them. The game runs for 13 rounds with a final score.

The app uses the big-screen/phone pattern: a host screen (computer or TV) manages the lobby and shows game status, while players interact on their phones.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **React Router 6**
- **Firebase Realtime Database**
- **react-gameroom** (linked locally via `npm link`)
- **react-i18next** (English + Portuguese)

## Routes

| Route | View | Audience |
|---|---|---|
| `/` | HomePage — Create or Join + language toggle | Anyone |
| `/join` | JoinGamePage — room code + nickname entry | Remote players |
| `/room/:roomId` | LobbyPage → BigScreenGame | Host (big screen) |
| `/room/:roomId/player/:playerId` | PlayerPage — phone gameplay | Remote players |

## react-gameroom Integration

The library handles the full lobby lifecycle. No library modifications needed.

**Components used:** `PlayerSlotsGrid`, `RoomQRCode`, `RoomInfoModal`, `JoinGame`, `PlayerScreen`, `useRoomState`

**Helpers used:** `createInitialRoom({ minPlayers: 4, maxPlayers: 8, requireFull: false })`, `joinPlayer`, `startGame`, `buildRoomUrl`, `buildPlayerUrl`

**Host-as-player pattern (Approach B):** The host joins as player 1 from the lobby screen by entering a nickname and calling `joinPlayer(roomState, 1)`. No special library concept needed — the host is just the first player who joins from the same screen as the lobby.

## Firebase Data Model

```
rooms/{roomId}/
  state/            ← react-gameroom RoomState (lobby, players, config)
  playerNames/      ← { 1: "Alice", 2: "Bob", ... }
  game/
    words/          ← string[] (13 secret words, set on game start)
    round/          ← number (0-12, current round index)
    answering/      ← number (1-based player ID of current guesser)
    phase/          ← "clue" | "filter" | "guess" | "validate"
    clues/          ← { [playerId]: string } (clues keyed by player ID)
    invalidClues/   ← number[] (player IDs whose clues were struck out)
    validClues/     ← string[] (clues remaining after filter)
    guess/          ← string | null (guesser's answer)
    points/         ← number (correct guesses, starts at 0)
    lostPoints/     ← number (penalties, starts at 0)
    message/        ← "right" | "wrong" | "pass" | null (snackbar feedback)
    lang/           ← "en" | "pt_br"
```

Player IDs are 1-based, matching react-gameroom's slot IDs. The `phase` field makes round state explicit rather than inferring it from which fields exist.

## Round Flow — Phase State Machine

Each of the 13 rounds cycles through 4 phases:

### Phase 1: Clue

All players except the guesser see the secret word and submit a one-word clue.

- **Guesser (phone):** "It's your turn to guess! Waiting for clues..."
- **Clue givers (phone):** Secret word displayed, text input for clue, "Send clue" button
- **Big screen:** Round number, whose turn, score dots, "Waiting for clues..." with count

Transition: when all non-guesser players have submitted clues → phase becomes `"filter"`.

### Phase 2: Filter

The filter player (next in rotation after the guesser) reviews all clues and taps to strike out duplicates or overly similar clues.

- **Filter player (phone):** List of clues, tap to toggle strikethrough, "Send valid clues" button
- **Everyone else (phone):** "[Name] needs to validate the clues..."
- **Big screen:** "Filtering clues..."

The filter player is determined by: `(answering % playerCount) + 1` (1-based, wrapping).

Transition: filter player submits → if zero valid clues remain, auto-pass (skip to score update with +1 lost point). Otherwise → phase becomes `"guess"`.

### Phase 3: Guess

The guesser sees the valid clues and types their guess, or passes.

- **Guesser (phone):** Valid clues as chips, discarded count, text input, "Pass" and "Send guess" buttons
- **Everyone else (phone):** "Waiting for [name]'s guess..."
- **Big screen:** "Waiting for guess..."

Transition: guesser submits guess → phase becomes `"validate"`. Guesser passes → score updates (+1 lost point), advance to next round.

### Phase 4: Validate

The filter player (same person who filtered) confirms whether the guess is correct.

- **Validator (phone):** The guess, the secret word, correct (checkmark) and wrong (X) buttons
- **Everyone else (phone):** "[Name] is validating..."
- **Big screen:** "Validating..."

Transition: validator confirms → score updates, snackbar message set, advance to next round.

### Scoring

- **Correct guess:** +1 point
- **Wrong guess:** +2 lost points
- **Pass (or auto-pass from zero valid clues):** +1 lost point

### Round Advancement

After scoring, reset round-specific fields (`clues`, `invalidClues`, `validClues`, `guess`, `phase`) and increment `round`. The answering player rotates: `(round % playerCount) + 1`.

### Game End

The game ends when `points + lostPoints >= 13` or after round index 12 (the 13th round). On finish, the game data is deleted from Firebase.

## Visual Design

Port of the original Vue app's aesthetic:

- **Background:** Unsplash party/confetti photo with dark overlay
- **Typography:** Knewave (Google Fonts) for headings, system font for body
- **Color palette:** Teal (`#4ecdc4`) for base/primary actions, Red (`#ff6b6b`) for accents/warnings, Yellow (`#f8d34f`) for highlights
- **Buttons:** Rounded pill shape (border-radius: 50px), Knewave font, uppercase
- **Cards:** White background, rounded corners, used for player lists and clue display
- **Clue chips:** Red-tinted chips (like Vuetify's `red lighten-4`) with Knewave font
- **Score tracker:** 13 dots in a row — green for correct, red for lost, transparent for remaining
- **Progress bar:** Indeterminate teal bar at bottom of screen during waiting phases
- **Snackbar:** Red notification bar for round result messages ("Well done!", "Bummer!", etc.)
- **Inputs:** White, centered text, uppercase, bold

## File Structure

```
unmatched/
  src/
    main.tsx
    App.tsx
    firebase.ts
    i18n.ts

    data/
      words.ts                ← English word list (ported from original)
      words_pt_br.ts          ← Portuguese word list (ported from original)

    hooks/
      useFirebaseRoom.ts      ← Firebase subscription for RoomState
      useGameState.ts         ← Firebase subscription for game/* path

    pages/
      HomePage.tsx             ← Create / Join buttons + language toggle
      JoinGamePage.tsx         ← JoinGame component + nickname
      LobbyPage.tsx            ← Host nickname input, PlayerSlotsGrid, QR, start
      PlayerPage.tsx           ← PlayerScreen with render props per phase

    components/
      SendClue.tsx             ← Secret word + clue input
      FilterClues.tsx          ← Clue list with tap-to-strike
      MakeGuess.tsx            ← Valid clue chips + guess input + pass
      ValidateAnswer.tsx       ← Guess vs. word + correct/wrong buttons
      FinishGame.tsx           ← Final score + play again / join
      ScoreTracker.tsx         ← 13-dot rating bar
      BigScreenGame.tsx        ← Host view during gameplay (status + score)

    styles/
      index.css                ← Global styles
```

## Key Hooks

### `useFirebaseRoom(roomId)`

Same pattern as the RPS example. Subscribes to `rooms/{roomId}/state`, returns `{ roomState, loading, error, updateRoom }`. Also exports `roomExists()` and `findFirstEmptySlot()` for the join flow.

### `useGameState(roomId)`

Subscribes to `rooms/{roomId}/game` and `rooms/{roomId}/playerNames`. Returns:

```ts
{
  phase: "clue" | "filter" | "guess" | "validate" | null;
  round: number;
  words: string[];
  answering: number;
  clues: Record<number, string>;
  invalidClues: number[];
  validClues: string[];
  guess: string | null;
  points: number;
  lostPoints: number;
  message: "right" | "wrong" | "pass" | null;
  lang: "en" | "pt_br";
  playerNames: Record<number, string>;
  playerCount: number;
}
```

## i18n

Using react-i18next with two namespaces (`en`, `pt_br`). Translation keys cover all UI strings. The language is set at game creation time (based on the creator's current selection) and stored in `game/lang`. When players join, they inherit the game's language.

## Game Lifecycle

1. **Host** opens `/`, picks language, clicks "Create new game"
2. `createInitialRoom` creates the room, navigates to `/room/{id}`
3. Host enters nickname on the lobby screen, calls `joinPlayer` for slot 1
4. Remote players scan QR or enter code at `/join`, enter nickname, join a slot
5. Host clicks "Start game" (enabled when 4+ players ready)
6. `startGame` transitions room status. Firebase gets populated with 13 random words, initial `round: 0`, `answering` set to a random player, `phase: "clue"`
7. Rounds cycle through clue → filter → guess → validate
8. After 13 rounds or when `points + lostPoints >= 13`, game ends
9. FinishGame screen shows score, "Play again" creates a new room, game data is deleted from Firebase
