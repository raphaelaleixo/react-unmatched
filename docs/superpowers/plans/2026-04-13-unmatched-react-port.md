# Unmatched React Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cooperative word-guessing party game (4-8 players) using React, Firebase Realtime Database, and the react-gameroom library for lobby management.

**Architecture:** Big-screen/phone pattern — a host screen manages the lobby and displays game status, while players interact on their phones. The react-gameroom library handles lobby lifecycle (room creation, player slots, game start). Game-specific state (rounds, clues, phases) lives in Firebase under `rooms/{roomId}/game/` and is managed by custom hooks and pure helper functions.

**Tech Stack:** React 18, TypeScript, Vite, Firebase Realtime Database, react-gameroom (npm link), react-i18next, React Router 6

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Vite project**

```bash
cd /Users/raphaelavellar/Documents/Projects/react-unmatched
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts (the only existing content is `docs/`).

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom@6 firebase react-i18next i18next
npm link react-gameroom
```

- [ ] **Step 3: Configure Vite for react-gameroom**

Replace `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

No alias needed — `npm link` handles resolution.

- [ ] **Step 4: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
```

- [ ] **Step 5: Update `.gitignore`**

Ensure it includes:

```
node_modules
dist
.env
.env.local
```

- [ ] **Step 6: Verify project builds**

```bash
npm run dev
```

Expected: Vite dev server starts on localhost with default template page.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html .env.example .gitignore src/
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Firebase Setup

**Files:**
- Create: `src/firebase.ts`

- [ ] **Step 1: Write `src/firebase.ts`**

```typescript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (env vars are typed as `string | undefined` by Vite).

- [ ] **Step 3: Commit**

```bash
git add src/firebase.ts
git commit -m "feat: add Firebase Realtime Database setup"
```

---

### Task 3: i18n Setup

**Files:**
- Create: `src/i18n.ts`
- Create: `src/locales/en.json`
- Create: `src/locales/pt_br.json`

- [ ] **Step 1: Write `src/i18n.ts`**

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pt_br from "./locales/pt_br.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt_br: { translation: pt_br },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 2: Write `src/locales/en.json`**

```json
{
  "home": {
    "title": "Unmatched",
    "newGame": "Create New Game",
    "joinGame": "Join Game"
  },
  "join": {
    "roomNotFound": "Room not found. Check the code and try again.",
    "roomFull": "Room is full.",
    "back": "Back"
  },
  "lobby": {
    "enterNickname": "Enter your nickname",
    "join": "Join",
    "playersReady": "{{count}} / {{max}} players ready",
    "startGame": "Start Game",
    "waitingForPlayers": "Waiting for players..."
  },
  "game": {
    "round": "Round {{current}} of 13",
    "yourTurnToGuess": "It's your turn to guess!",
    "waitingForClues": "Waiting for clues...",
    "cluesReceived": "{{count}} / {{total}} clues received",
    "enterClue": "Enter your clue",
    "sendClue": "Send Clue",
    "filteringClues": "Filtering clues...",
    "validateClues": "{{name}} needs to validate the clues...",
    "sendValidClues": "Send Valid Clues",
    "waitingForGuess": "Waiting for guess...",
    "waitingForName": "Waiting for {{name}}'s guess...",
    "enterGuess": "Enter your guess",
    "sendGuess": "Send Guess",
    "pass": "Pass",
    "discarded": "{{count}} clue(s) discarded",
    "validating": "Validating...",
    "validatingName": "{{name}} is validating...",
    "correct": "Correct",
    "wrong": "Wrong"
  },
  "result": {
    "right": "Well done!",
    "wrong": "Bummer!",
    "pass": "Passed..."
  },
  "finish": {
    "gameOver": "Game Over!",
    "score": "{{points}} out of 13",
    "playAgain": "Play Again",
    "joinAnother": "Join Another Game"
  }
}
```

- [ ] **Step 3: Write `src/locales/pt_br.json`**

```json
{
  "home": {
    "title": "Unmatched",
    "newGame": "Criar Novo Jogo",
    "joinGame": "Entrar em Jogo"
  },
  "join": {
    "roomNotFound": "Sala não encontrada. Verifique o código e tente novamente.",
    "roomFull": "Sala cheia.",
    "back": "Voltar"
  },
  "lobby": {
    "enterNickname": "Digite seu apelido",
    "join": "Entrar",
    "playersReady": "{{count}} / {{max}} jogadores prontos",
    "startGame": "Iniciar Jogo",
    "waitingForPlayers": "Aguardando jogadores..."
  },
  "game": {
    "round": "Rodada {{current}} de 13",
    "yourTurnToGuess": "É a sua vez de adivinhar!",
    "waitingForClues": "Aguardando dicas...",
    "cluesReceived": "{{count}} / {{total}} dicas recebidas",
    "enterClue": "Digite sua dica",
    "sendClue": "Enviar Dica",
    "filteringClues": "Filtrando dicas...",
    "validateClues": "{{name}} precisa validar as dicas...",
    "sendValidClues": "Enviar Dicas Válidas",
    "waitingForGuess": "Aguardando palpite...",
    "waitingForName": "Aguardando o palpite de {{name}}...",
    "enterGuess": "Digite seu palpite",
    "sendGuess": "Enviar Palpite",
    "pass": "Passar",
    "discarded": "{{count}} dica(s) descartada(s)",
    "validating": "Validando...",
    "validatingName": "{{name}} está validando...",
    "correct": "Correto",
    "wrong": "Errado"
  },
  "result": {
    "right": "Muito bem!",
    "wrong": "Que pena!",
    "pass": "Passou..."
  },
  "finish": {
    "gameOver": "Fim de Jogo!",
    "score": "{{points}} de 13",
    "playAgain": "Jogar Novamente",
    "joinAnother": "Entrar em Outro Jogo"
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/i18n.ts src/locales/
git commit -m "feat: add i18n with English and Portuguese translations"
```

---

### Task 4: Word Lists

**Files:**
- Create: `src/data/words.ts`
- Create: `src/data/words_pt_br.ts`

- [ ] **Step 1: Write `src/data/words.ts`**

```typescript
const words: string[] = [
  "ADVENTURE", "AIRPLANE", "ANCHOR", "ASTRONAUT", "BANANA",
  "BATTERY", "BICYCLE", "BLANKET", "BLOSSOM", "BRIDGE",
  "BUTTERFLY", "CALENDAR", "CAMERA", "CAMPFIRE", "CANDLE",
  "CASTLE", "CATERPILLAR", "CHAMPION", "CHOCOLATE", "CIRCUS",
  "CLOUD", "COMPASS", "COOKIE", "CRYSTAL", "CURTAIN",
  "DIAMOND", "DINOSAUR", "DOLPHIN", "DRAGON", "DREAM",
  "ECLIPSE", "ELEPHANT", "EMERALD", "ENVELOPE", "FEATHER",
  "FIREWORK", "FLAMINGO", "FOUNTAIN", "GALAXY", "GARDEN",
  "GLACIER", "GUITAR", "HAMMOCK", "HARBOR", "HARVEST",
  "HELICOPTER", "HORIZON", "ICEBERG", "ISLAND", "JIGSAW",
  "JUNGLE", "KALEIDOSCOPE", "KANGAROO", "KEYBOARD", "KINGDOM",
  "LANTERN", "LEMON", "LIBRARY", "LIGHTHOUSE", "MAGNET",
  "MARBLE", "MEADOW", "MELODY", "MIRACLE", "MONUMENT",
  "MOONLIGHT", "MOUNTAIN", "MUSHROOM", "MYSTERY", "NECKLACE",
  "NOTEBOOK", "OCEAN", "ORCHESTRA", "PAINTING", "PALACE",
  "PARACHUTE", "PEACOCK", "PENGUIN", "PHANTOM", "PIANO",
  "PILLOW", "PIRATE", "PLANET", "POPCORN", "PYRAMID",
  "RAINBOW", "ROBOT", "ROCKET", "SAFARI", "SAILBOAT",
  "SANDWICH", "SATELLITE", "SCARECROW", "SHADOW", "SKELETON",
  "SNOWFLAKE", "SPACESHIP", "SPIDER", "STARFISH", "SUBMARINE",
  "SUNRISE", "SYMPHONY", "TELESCOPE", "THUNDER", "TIGER",
  "TORNADO", "TREASURE", "TULIP", "UMBRELLA", "UNICORN",
  "VACATION", "VAMPIRE", "VOLCANO", "WATERFALL", "WIZARD",
];

export default words;
```

- [ ] **Step 2: Write `src/data/words_pt_br.ts`**

```typescript
const words: string[] = [
  "ABACAXI", "ÂNCORA", "ARANHA", "ASTRONAUTA", "BALEIA",
  "BATERIA", "BICICLETA", "BORBOLETA", "BRIGADEIRO", "CACHOEIRA",
  "CANGURU", "CARACOL", "CASTELO", "CAVALO", "CENOURA",
  "CHAPÉU", "CHOCOLATE", "CHUVA", "CIRCO", "COELHO",
  "COMETA", "CORUJA", "CRISTAL", "CUPCAKE", "DELFIM",
  "DIAMANTE", "DINOSSAURO", "DRAGÃO", "ECLIPSE", "ELEFANTE",
  "ESMERALDA", "ESPELHO", "ESTRELA", "FAROL", "FLORESTA",
  "FOGUETE", "FORMIGA", "GALÁXIA", "GIRASSOL", "GUITARRA",
  "HELICÓPTERO", "HORIZONTE", "ICEBERG", "IGUANA", "ILHA",
  "JARDIM", "JACARÉ", "JOANINHA", "LABIRINTO", "LAGARTO",
  "LANTERNA", "LEÃO", "LIMÃO", "LIVRO", "LUAR",
  "MÁGICA", "MARIPOSA", "MELODIA", "MONTANHA", "MORANGO",
  "NAVIO", "NUVEM", "OCEANO", "ORQUESTRA", "PALHAÇO",
  "PAPAGAIO", "PÁSSARO", "PIANISTA", "PINGUIM", "PIPOCA",
  "PIRATA", "PLANETA", "PRESENTE", "PRINCESA", "PIRÂMIDE",
  "RAIO", "ROBÔ", "SAFÁRI", "SEMENTE", "SEREIA",
  "SORVETE", "SUBMARINO", "TARTARUGA", "TELESCÓPIO", "TESOURO",
  "TIGRE", "TORNADO", "TROVÃO", "TULIPA", "UNICÓRNIO",
  "VAMPIRO", "VELEIRO", "VIOLÃO", "VULCÃO", "XADREZ",
];

export default words;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/
git commit -m "feat: add English and Portuguese word lists"
```

---

### Task 5: Game Helper Functions (TDD)

**Files:**
- Create: `src/helpers/gameHelpers.ts`
- Create: `src/helpers/gameHelpers.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
```

Add to `tsconfig.json` under `compilerOptions`:

```json
"types": ["vitest/globals"]
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write failing tests**

```typescript
// src/helpers/gameHelpers.test.ts
import { describe, it, expect } from "vitest";
import {
  pickWords,
  getFilterPlayer,
  getNextAnswering,
  calculateScore,
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

describe("calculateScore", () => {
  it("adds 1 point for correct guess", () => {
    expect(calculateScore("right", 2, 1)).toEqual({ points: 3, lostPoints: 1 });
  });

  it("adds 2 lost points for wrong guess", () => {
    expect(calculateScore("wrong", 2, 1)).toEqual({ points: 2, lostPoints: 3 });
  });

  it("adds 1 lost point for pass", () => {
    expect(calculateScore("pass", 2, 1)).toEqual({ points: 2, lostPoints: 2 });
  });
});

describe("isGameOver", () => {
  it("returns true when points + lostPoints >= 13", () => {
    expect(isGameOver(7, 6, 5)).toBe(true);
    expect(isGameOver(10, 3, 5)).toBe(true);
  });

  it("returns true when round exceeds 12", () => {
    expect(isGameOver(3, 2, 13)).toBe(true);
  });

  it("returns false when game is still in progress", () => {
    expect(isGameOver(3, 2, 5)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: FAIL — module `./gameHelpers` not found.

- [ ] **Step 4: Write implementation**

```typescript
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

export function isGameOver(
  points: number,
  lostPoints: number,
  round: number,
): boolean {
  return points + lostPoints >= 13 || round > 12;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/helpers/ vite.config.ts tsconfig.json package.json package-lock.json
git commit -m "feat: add game helper functions with tests"
```

---

### Task 6: useFirebaseRoom Hook

**Files:**
- Create: `src/hooks/useFirebaseRoom.ts`

- [ ] **Step 1: Write `src/hooks/useFirebaseRoom.ts`**

Adapted from the react-gameroom example app:

```typescript
import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { db } from "../firebase";
import type { RoomState, PlayerSlot } from "react-gameroom";

function parsePlayersArray(raw: unknown): PlayerSlot[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, PlayerSlot>);
  }
  return [];
}

function snapshotToRoomState(data: Record<string, unknown>): RoomState {
  return {
    roomId: data.roomId as string,
    status: data.status as RoomState["status"],
    players: parsePlayersArray(data.players),
    config: data.config as RoomState["config"],
  };
}

export function useFirebaseRoom(roomId: string | undefined) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomState(snapshotToRoomState(data));
          setError(null);
        } else {
          setRoomState(null);
          setError("Room not found");
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [roomId]);

  const updateRoom = useCallback(
    async (newState: RoomState) => {
      if (!roomId) return;
      await set(ref(db, `rooms/${roomId}/state`), newState);
    },
    [roomId],
  );

  return { roomState, loading, error, updateRoom };
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state/roomId`));
  return snapshot.exists();
}

export async function findFirstEmptySlot(
  roomId: string,
): Promise<number | null> {
  const snapshot = await get(ref(db, `rooms/${roomId}/state/players`));
  const players = parsePlayersArray(snapshot.val());
  const empty = players.find((p) => p.status === "empty");
  return empty ? empty.id : null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFirebaseRoom.ts
git commit -m "feat: add useFirebaseRoom hook for room state management"
```

---

### Task 7: useGameState Hook

**Files:**
- Create: `src/hooks/useGameState.ts`

- [ ] **Step 1: Write `src/hooks/useGameState.ts`**

```typescript
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export interface GameState {
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

const INITIAL_STATE: GameState = {
  phase: null,
  round: 0,
  words: [],
  answering: 0,
  clues: {},
  invalidClues: [],
  validClues: [],
  guess: null,
  points: 0,
  lostPoints: 0,
  message: null,
  lang: "en",
  playerNames: {},
  playerCount: 0,
};

export function useGameState(roomId: string | undefined): GameState {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    if (!roomId) return;

    const gameRef = ref(db, `rooms/${roomId}/game`);
    const namesRef = ref(db, `rooms/${roomId}/playerNames`);

    const unsubGame = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setState((prev) => ({
        ...prev,
        phase: data.phase ?? null,
        round: data.round ?? 0,
        words: data.words ?? [],
        answering: data.answering ?? 0,
        clues: data.clues ?? {},
        invalidClues: data.invalidClues ?? [],
        validClues: data.validClues ?? [],
        guess: data.guess ?? null,
        points: data.points ?? 0,
        lostPoints: data.lostPoints ?? 0,
        message: data.message ?? null,
        lang: data.lang ?? "en",
      }));
    });

    const unsubNames = onValue(namesRef, (snapshot) => {
      const data = snapshot.val() ?? {};
      setState((prev) => ({
        ...prev,
        playerNames: data,
        playerCount: Object.keys(data).length,
      }));
    });

    return () => {
      unsubGame();
      unsubNames();
    };
  }, [roomId]);

  return state;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat: add useGameState hook for game state subscription"
```

---

### Task 8: Global Styles

**Files:**
- Create: `src/styles/index.css`

- [ ] **Step 1: Write `src/styles/index.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=Knewave&display=swap");

:root {
  --color-teal: #4ecdc4;
  --color-red: #ff6b6b;
  --color-yellow: #f8d34f;
  --color-white: #ffffff;
  --color-overlay: rgba(0, 0, 0, 0.6);
  --font-heading: "Knewave", cursive;
  --font-body: system-ui, -apple-system, sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  color: var(--color-white);
  background: url("https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80")
    center / cover no-repeat fixed;
  min-height: 100vh;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: -1;
}

h1,
h2,
h3 {
  font-family: var(--font-heading);
  text-transform: uppercase;
}

/* Page layout */
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  gap: 1.5rem;
}

/* Buttons */
.btn {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  text-transform: uppercase;
  border: none;
  border-radius: 50px;
  padding: 0.8rem 2.5rem;
  cursor: pointer;
  background: var(--color-teal);
  color: var(--color-white);
  transition: opacity 0.2s;
}

.btn:hover:not(:disabled) {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--red {
  background: var(--color-red);
}

.btn--yellow {
  background: var(--color-yellow);
  color: #333;
}

.btn--outline {
  background: transparent;
  border: 2px solid var(--color-teal);
  color: var(--color-teal);
}

/* Inputs */
.input {
  font-size: 1.1rem;
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
  background: var(--color-white);
  color: #333;
  border: none;
  border-radius: 50px;
  padding: 0.8rem 1.5rem;
  width: 100%;
  max-width: 300px;
  outline: none;
}

.input:focus {
  box-shadow: 0 0 0 3px var(--color-teal);
}

/* Cards */
.card {
  background: var(--color-white);
  color: #333;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
}

/* Clue chips */
.chip {
  display: inline-block;
  font-family: var(--font-heading);
  font-size: 1rem;
  background: #ffcdd2;
  color: #c62828;
  border-radius: 20px;
  padding: 0.4rem 1rem;
  margin: 0.3rem;
}

.chip--struck {
  text-decoration: line-through;
  opacity: 0.5;
}

/* Score tracker */
.score-tracker {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 0.5rem 0;
}

.score-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: background 0.3s;
}

.score-dot--correct {
  background: var(--color-teal);
}

.score-dot--lost {
  background: var(--color-red);
}

/* Progress bar */
.progress-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress-bar::after {
  content: "";
  display: block;
  height: 100%;
  width: 40%;
  background: var(--color-teal);
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-red);
  color: var(--color-white);
  font-family: var(--font-heading);
  font-size: 1.2rem;
  text-transform: uppercase;
  border-radius: 50px;
  padding: 0.8rem 2rem;
  z-index: 100;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* QR code wrapper */
.qr-wrapper {
  display: inline-block;
  background: var(--color-white);
  padding: 12px;
  border-radius: 12px;
}

/* Room badge */
.room-badge {
  font-family: var(--font-heading);
  font-size: 2rem;
  letter-spacing: 0.1em;
}

/* Language toggle */
.lang-toggle {
  display: flex;
  gap: 0.5rem;
}

.lang-toggle button {
  background: none;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: var(--color-white);
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.lang-toggle button.active {
  border-color: var(--color-teal);
  background: var(--color-teal);
}

/* Validate buttons */
.validate-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.validate-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.validate-btn:hover {
  transform: scale(1.1);
}

.validate-btn--correct {
  background: var(--color-teal);
  color: var(--color-white);
}

.validate-btn--wrong {
  background: var(--color-red);
  color: var(--color-white);
}

/* Text utilities */
.text-center {
  text-align: center;
}

.text-muted {
  opacity: 0.7;
}

.text-error {
  color: var(--color-red);
}

.text-large {
  font-size: 1.5rem;
}

.text-heading {
  font-family: var(--font-heading);
}
```

- [ ] **Step 2: Verify the CSS loads**

Update `src/main.tsx` to import the stylesheet:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="page">
      <h1>Unmatched</h1>
    </div>
  </React.StrictMode>,
);
```

```bash
npm run dev
```

Expected: Dev server shows "Unmatched" heading with Knewave font, dark overlay background, centered layout.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css src/main.tsx
git commit -m "feat: add global styles with Knewave font and color palette"
```

---

### Task 9: App Routing Shell

**Files:**
- Create: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write `src/App.tsx`**

```typescript
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinGamePage from "./pages/JoinGamePage";
import LobbyPage from "./pages/LobbyPage";
import PlayerPage from "./pages/PlayerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinGamePage />} />
      <Route path="/room/:roomId" element={<LobbyPage />} />
      <Route path="/room/:roomId/player/:playerId" element={<PlayerPage />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Create page stubs**

Create minimal stubs so routing compiles. Each page will be implemented in later tasks.

`src/pages/HomePage.tsx`:

```typescript
export default function HomePage() {
  return <div className="page"><h1>Unmatched</h1></div>;
}
```

`src/pages/JoinGamePage.tsx`:

```typescript
export default function JoinGamePage() {
  return <div className="page"><h2>Join Game</h2></div>;
}
```

`src/pages/LobbyPage.tsx`:

```typescript
export default function LobbyPage() {
  return <div className="page"><h2>Lobby</h2></div>;
}
```

`src/pages/PlayerPage.tsx`:

```typescript
export default function PlayerPage() {
  return <div className="page"><h2>Player</h2></div>;
}
```

- [ ] **Step 3: Update `src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Remove Vite template boilerplate**

Delete `src/App.css`, `src/index.css` (replaced by `src/styles/index.css`), and the `src/assets/` folder if they exist.

- [ ] **Step 5: Verify routing works**

```bash
npm run dev
```

Navigate to `/`, `/join`, `/room/TEST`, `/room/TEST/player/1` — each should render its stub heading.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages/ src/main.tsx
git rm -f src/App.css src/index.css src/assets/react.svg 2>/dev/null; true
git commit -m "feat: add React Router with page stubs"
```

---

### Task 10: ScoreTracker Component

**Files:**
- Create: `src/components/ScoreTracker.tsx`
- Create: `src/components/ScoreTracker.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/components/ScoreTracker.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ScoreTracker from "./ScoreTracker";

describe("ScoreTracker", () => {
  it("renders 13 dots", () => {
    const { container } = render(<ScoreTracker points={0} lostPoints={0} />);
    const dots = container.querySelectorAll(".score-dot");
    expect(dots).toHaveLength(13);
  });

  it("marks correct dots green", () => {
    const { container } = render(<ScoreTracker points={3} lostPoints={0} />);
    const correct = container.querySelectorAll(".score-dot--correct");
    expect(correct).toHaveLength(3);
  });

  it("marks lost dots red", () => {
    const { container } = render(<ScoreTracker points={2} lostPoints={4} />);
    const lost = container.querySelectorAll(".score-dot--lost");
    expect(lost).toHaveLength(4);
  });

  it("remaining dots are neutral", () => {
    const { container } = render(<ScoreTracker points={2} lostPoints={3} />);
    const all = container.querySelectorAll(".score-dot");
    const correct = container.querySelectorAll(".score-dot--correct");
    const lost = container.querySelectorAll(".score-dot--lost");
    expect(all.length - correct.length - lost.length).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/ScoreTracker.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// src/components/ScoreTracker.tsx
interface ScoreTrackerProps {
  points: number;
  lostPoints: number;
}

export default function ScoreTracker({ points, lostPoints }: ScoreTrackerProps) {
  const dots = Array.from({ length: 13 }, (_, i) => {
    if (i < points) return "correct";
    if (i < points + lostPoints) return "lost";
    return "neutral";
  });

  return (
    <div className="score-tracker">
      {dots.map((type, i) => (
        <div
          key={i}
          className={`score-dot${type === "correct" ? " score-dot--correct" : type === "lost" ? " score-dot--lost" : ""}`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/ScoreTracker.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreTracker.tsx src/components/ScoreTracker.test.tsx
git commit -m "feat: add ScoreTracker component with 13-dot display"
```

---

### Task 11: HomePage

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Write `src/pages/HomePage.tsx`**

```typescript
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language;

  function toggleLang(lang: string) {
    i18n.changeLanguage(lang);
  }

  async function handleNewGame() {
    const room = createInitialRoom({
      minPlayers: 4,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), currentLang);
    navigate(`/room/${room.roomId}`);
  }

  return (
    <div className="page">
      <h1>{t("home.title")}</h1>

      <div className="lang-toggle">
        <button
          className={currentLang === "en" ? "active" : ""}
          onClick={() => toggleLang("en")}
        >
          EN
        </button>
        <button
          className={currentLang === "pt_br" ? "active" : ""}
          onClick={() => toggleLang("pt_br")}
        >
          PT
        </button>
      </div>

      <button className="btn" onClick={handleNewGame}>
        {t("home.newGame")}
      </button>

      <button
        className="btn btn--outline"
        onClick={() => navigate("/join")}
      >
        {t("home.joinGame")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Navigate to `/`. Should see title, language toggle (EN/PT), and two buttons. Clicking "Create New Game" should create a Firebase room and navigate to `/room/{id}` (requires `.env` with valid Firebase credentials). Clicking "Join Game" navigates to `/join`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: add HomePage with room creation and language toggle"
```

---

### Task 12: JoinGamePage

**Files:**
- Modify: `src/pages/JoinGamePage.tsx`

- [ ] **Step 1: Write `src/pages/JoinGamePage.tsx`**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { JoinGame } from "react-gameroom";
import { roomExists, findFirstEmptySlot } from "../hooks/useFirebaseRoom";

export default function JoinGamePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(roomCode: string) {
    setError(null);

    const exists = await roomExists(roomCode);
    if (!exists) {
      setError(t("join.roomNotFound"));
      return;
    }

    const slotId = await findFirstEmptySlot(roomCode);
    if (slotId === null) {
      setError(t("join.roomFull"));
      return;
    }

    navigate(`/room/${roomCode}/player/${slotId}`);
  }

  return (
    <div className="page">
      <h2>{t("home.joinGame")}</h2>

      <JoinGame
        onJoin={handleJoin}
        inputClassName="input"
        buttonClassName="btn"
        renderError={error ? () => <p className="text-error">{error}</p> : undefined}
      />

      <button
        className="btn btn--outline"
        onClick={() => navigate("/")}
      >
        {t("join.back")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/join`. Enter an invalid code — should show error. Enter a valid room code — should navigate to player page.

- [ ] **Step 3: Commit**

```bash
git add src/pages/JoinGamePage.tsx
git commit -m "feat: add JoinGamePage with room validation"
```

---

### Task 13: LobbyPage

**Files:**
- Modify: `src/pages/LobbyPage.tsx`

- [ ] **Step 1: Write `src/pages/LobbyPage.tsx`**

```typescript
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import {
  PlayerSlotsGrid,
  RoomQRCode,
  RoomInfoModal,
  useRoomState,
  joinPlayer,
  startGame,
  buildPlayerUrl,
} from "react-gameroom";
import { db } from "../firebase";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { pickWords, getNextAnswering } from "../helpers/gameHelpers";
import BigScreenGame from "../components/BigScreenGame";

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const gameState = useGameState(roomId);
  const { t } = useTranslation();

  const [nickname, setNickname] = useState("");
  const [hostJoined, setHostJoined] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 4, maxPlayers: 8, requireFull: false },
    },
  );

  if (loading || !roomState) {
    return <div className="page"><p>{t("lobby.waitingForPlayers")}</p></div>;
  }

  if (roomState.status === "started") {
    return <BigScreenGame roomId={roomId!} gameState={gameState} />;
  }

  async function handleHostJoin() {
    if (!nickname.trim() || !roomState) return;
    await set(ref(db, `rooms/${roomId}/playerNames/1`), nickname.trim());
    await updateRoom(joinPlayer(roomState, 1));
    setHostJoined(true);
  }

  async function handleStartGame() {
    if (!roomState) return;
    const lang = (gameState.lang || "en") as "en" | "pt_br";
    const words = pickWords(lang, 13);
    const playerCount = gameState.playerCount;
    const firstAnswering = Math.floor(Math.random() * playerCount) + 1;

    await set(ref(db, `rooms/${roomId}/game`), {
      words,
      round: 0,
      answering: firstAnswering,
      phase: "clue",
      points: 0,
      lostPoints: 0,
      message: null,
      lang,
    });

    await updateRoom(startGame(roomState));
  }

  return (
    <div className="page">
      <div className="room-badge">{roomState.roomId}</div>

      <div className="qr-wrapper">
        <RoomQRCode roomId={roomState.roomId} size={160} />
      </div>

      <p>
        {t("lobby.playersReady", {
          count: derived.readyCount,
          max: roomState.config.maxPlayers,
        })}
      </p>

      <PlayerSlotsGrid
        players={roomState.players}
        buildSlotHref={(id) => buildPlayerUrl(roomState.roomId, id)}
      />

      {!hostJoined && (
        <>
          <input
            className="input"
            placeholder={t("lobby.enterNickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHostJoin()}
          />
          <button
            className="btn"
            onClick={handleHostJoin}
            disabled={!nickname.trim()}
          >
            {t("lobby.join")}
          </button>
        </>
      )}

      {hostJoined && (
        <button
          className="btn btn--yellow"
          onClick={handleStartGame}
          disabled={!derived.canStart}
        >
          {t("lobby.startGame")}
        </button>
      )}

      <button className="btn btn--outline" onClick={() => setShowInfo(true)}>
        i
      </button>

      <RoomInfoModal
        roomState={roomState}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Create a game from `/`, confirm lobby page loads with room code, QR code, nickname input. Enter nickname → join as host → start button appears (disabled until 4 players).

- [ ] **Step 3: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: add LobbyPage with host join, QR code, and game start"
```

---

### Task 14: BigScreenGame Component

**Files:**
- Create: `src/components/BigScreenGame.tsx`

- [ ] **Step 1: Write `src/components/BigScreenGame.tsx`**

```typescript
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";

interface BigScreenGameProps {
  roomId: string;
  gameState: GameState;
}

export default function BigScreenGame({ roomId, gameState }: BigScreenGameProps) {
  const { t, i18n } = useTranslation();
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  useEffect(() => {
    if (gameState.message) {
      setShowSnackbar(true);
      const timer = setTimeout(() => setShowSnackbar(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.message, gameState.round]);

  const guesserName =
    gameState.playerNames[gameState.answering] ||
    `Player ${gameState.answering}`;

  const isFinished =
    gameState.points + gameState.lostPoints >= 13 || gameState.round > 12;

  if (isFinished) {
    return (
      <div className="page">
        <h1>{t("finish.gameOver")}</h1>
        <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} />
        <p className="text-large text-heading">
          {t("finish.score", { points: gameState.points })}
        </p>
      </div>
    );
  }

  function phaseMessage(): string {
    switch (gameState.phase) {
      case "clue": {
        const clueCount = Object.keys(gameState.clues).length;
        const total = gameState.playerCount - 1;
        return t("game.cluesReceived", { count: clueCount, total });
      }
      case "filter":
        return t("game.filteringClues");
      case "guess":
        return t("game.waitingForGuess");
      case "validate":
        return t("game.validating");
      default:
        return "";
    }
  }

  return (
    <div className="page">
      <div className="room-badge">{roomId}</div>

      <h2>{t("game.round", { current: gameState.round + 1 })}</h2>

      <p className="text-large">
        {guesserName}
      </p>

      <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} />

      <p className="text-muted">{phaseMessage()}</p>

      <div className="progress-bar" />

      {showSnackbar && gameState.message && (
        <div className="snackbar">{t(`result.${gameState.message}`)}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BigScreenGame.tsx
git commit -m "feat: add BigScreenGame host view with score and phase status"
```

---

### Task 15: PlayerPage Shell

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Write `src/pages/PlayerPage.tsx`**

```typescript
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set, onValue } from "firebase/database";
import { PlayerScreen, joinPlayer } from "react-gameroom";
import { db } from "../firebase";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { getFilterPlayer, isGameOver } from "../helpers/gameHelpers";
import SendClue from "../components/SendClue";
import FilterClues from "../components/FilterClues";
import MakeGuess from "../components/MakeGuess";
import ValidateAnswer from "../components/ValidateAnswer";
import FinishGame from "../components/FinishGame";

export default function PlayerPage() {
  const { roomId, playerId: playerIdStr } = useParams<{
    roomId: string;
    playerId: string;
  }>();
  const playerId = Number(playerIdStr);
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const gameState = useGameState(roomId);
  const { t, i18n } = useTranslation();

  const [nickname, setNickname] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  useEffect(() => {
    if (!roomId) return;
    const nameRef = ref(db, `rooms/${roomId}/playerNames/${playerId}`);
    const unsub = onValue(nameRef, (snap) => {
      if (snap.val()) setSavedName(snap.val());
    });
    return unsub;
  }, [roomId, playerId]);

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
  }

  async function handleNameSave() {
    if (!nickname.trim() || !roomState) return;
    await set(
      ref(db, `rooms/${roomId}/playerNames/${playerId}`),
      nickname.trim(),
    );
    await updateRoom(joinPlayer(roomState, playerId));
    setSavedName(nickname.trim());
  }

  function renderGamePhase() {
    const isAnswering = gameState.answering === playerId;
    const filterPlayer = getFilterPlayer(
      gameState.answering,
      gameState.playerCount,
    );
    const isFilter = filterPlayer === playerId;
    const finished = isGameOver(
      gameState.points,
      gameState.lostPoints,
      gameState.round,
    );

    if (finished) {
      return <FinishGame gameState={gameState} />;
    }

    switch (gameState.phase) {
      case "clue":
        if (isAnswering) {
          return (
            <div className="text-center">
              <h2>{t("game.yourTurnToGuess")}</h2>
              <p className="text-muted">{t("game.waitingForClues")}</p>
              <div className="progress-bar" />
            </div>
          );
        }
        return (
          <SendClue
            roomId={roomId!}
            playerId={playerId}
            word={gameState.words[gameState.round]}
            submitted={playerId in gameState.clues}
          />
        );

      case "filter":
        if (isFilter) {
          return (
            <FilterClues
              roomId={roomId!}
              clues={gameState.clues}
              playerNames={gameState.playerNames}
              answering={gameState.answering}
              playerCount={gameState.playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="text-center">
            <p className="text-muted">
              {t("game.validateClues", {
                name: gameState.playerNames[filterPlayer] || `Player ${filterPlayer}`,
              })}
            </p>
            <div className="progress-bar" />
          </div>
        );

      case "guess":
        if (isAnswering) {
          return (
            <MakeGuess
              roomId={roomId!}
              validClues={gameState.validClues}
              invalidCount={gameState.invalidClues.length}
              answering={gameState.answering}
              playerCount={gameState.playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="text-center">
            <p className="text-muted">
              {t("game.waitingForName", {
                name: gameState.playerNames[gameState.answering] || `Player ${gameState.answering}`,
              })}
            </p>
            <div className="progress-bar" />
          </div>
        );

      case "validate": {
        if (isFilter) {
          return (
            <ValidateAnswer
              roomId={roomId!}
              guess={gameState.guess!}
              word={gameState.words[gameState.round]}
              answering={gameState.answering}
              playerCount={gameState.playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="text-center">
            <p className="text-muted">
              {t("game.validatingName", {
                name: gameState.playerNames[filterPlayer] || `Player ${filterPlayer}`,
              })}
            </p>
            <div className="progress-bar" />
          </div>
        );
      }

      default:
        return null;
    }
  }

  return (
    <PlayerScreen
      roomState={roomState}
      playerId={playerId}
      className="page"
      renderEmpty={() => (
        <div className="text-center">
          <p className="room-badge">{roomState.roomId}</p>
          <p className="text-muted">Player {playerId}</p>
          <input
            className="input"
            placeholder={t("lobby.enterNickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
          />
          <br />
          <br />
          <button
            className="btn"
            onClick={handleNameSave}
            disabled={!nickname.trim()}
          >
            {t("lobby.join")}
          </button>
        </div>
      )}
      renderReady={() => (
        <div className="text-center">
          <p className="room-badge">{roomState.roomId}</p>
          <p>
            {savedName || nickname}
          </p>
          <p className="text-muted">{t("lobby.waitingForPlayers")}</p>
          <div className="progress-bar" />
        </div>
      )}
      renderStarted={() => renderGamePhase()}
    />
  );
}
```

- [ ] **Step 2: Create component stubs**

Create minimal stubs for the game phase components so PlayerPage compiles. Each will be fully implemented in subsequent tasks.

`src/components/SendClue.tsx`:

```typescript
interface SendClueProps {
  roomId: string;
  playerId: number;
  word: string;
  submitted: boolean;
}

export default function SendClue(_props: SendClueProps) {
  return <div>SendClue placeholder</div>;
}
```

`src/components/FilterClues.tsx`:

```typescript
interface FilterCluesProps {
  roomId: string;
  clues: Record<number, string>;
  playerNames: Record<number, string>;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function FilterClues(_props: FilterCluesProps) {
  return <div>FilterClues placeholder</div>;
}
```

`src/components/MakeGuess.tsx`:

```typescript
interface MakeGuessProps {
  roomId: string;
  validClues: string[];
  invalidCount: number;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function MakeGuess(_props: MakeGuessProps) {
  return <div>MakeGuess placeholder</div>;
}
```

`src/components/ValidateAnswer.tsx`:

```typescript
interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function ValidateAnswer(_props: ValidateAnswerProps) {
  return <div>ValidateAnswer placeholder</div>;
}
```

`src/components/FinishGame.tsx`:

```typescript
import type { GameState } from "../hooks/useGameState";

interface FinishGameProps {
  gameState: GameState;
}

export default function FinishGame(_props: FinishGameProps) {
  return <div>FinishGame placeholder</div>;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PlayerPage.tsx src/components/SendClue.tsx src/components/FilterClues.tsx src/components/MakeGuess.tsx src/components/ValidateAnswer.tsx src/components/FinishGame.tsx
git commit -m "feat: add PlayerPage with phase routing and component stubs"
```

---

### Task 16: SendClue Component

**Files:**
- Modify: `src/components/SendClue.tsx`

- [ ] **Step 1: Write `src/components/SendClue.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

interface SendClueProps {
  roomId: string;
  playerId: number;
  word: string;
  submitted: boolean;
}

export default function SendClue({
  roomId,
  playerId,
  word,
  submitted,
}: SendClueProps) {
  const { t } = useTranslation();
  const [clue, setClue] = useState("");

  async function handleSubmit() {
    const trimmed = clue.trim();
    if (!trimmed) return;
    await set(ref(db, `rooms/${roomId}/game/clues/${playerId}`), trimmed);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="text-muted">{t("game.waitingForClues")}</p>
        <div className="progress-bar" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-heading">{word}</h2>

      <input
        className="input"
        placeholder={t("game.enterClue")}
        value={clue}
        onChange={(e) => setClue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        maxLength={30}
      />
      <br />
      <br />
      <button
        className="btn"
        onClick={handleSubmit}
        disabled={!clue.trim()}
      >
        {t("game.sendClue")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SendClue.tsx
git commit -m "feat: add SendClue component with word display and clue input"
```

---

### Task 17: FilterClues Component

**Files:**
- Modify: `src/components/FilterClues.tsx`

- [ ] **Step 1: Write `src/components/FilterClues.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering, isGameOver } from "../helpers/gameHelpers";

interface FilterCluesProps {
  roomId: string;
  clues: Record<number, string>;
  playerNames: Record<number, string>;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function FilterClues({
  roomId,
  clues,
  playerNames,
  answering,
  playerCount,
  round,
  points,
  lostPoints,
}: FilterCluesProps) {
  const { t } = useTranslation();
  const [struck, setStruck] = useState<Set<number>>(new Set());

  function toggleStrike(playerId: number) {
    setStruck((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    const invalidClues = Array.from(struck);
    const validClues = Object.entries(clues)
      .filter(([id]) => !struck.has(Number(id)))
      .map(([, clue]) => clue);

    const gameRef = ref(db, `rooms/${roomId}/game`);

    if (validClues.length === 0) {
      // Auto-pass: no valid clues remain
      const score = calculateScore("pass", points, lostPoints);
      const nextRound = round + 1;

      await set(ref(db, `rooms/${roomId}/game/invalidClues`), invalidClues);
      await set(ref(db, `rooms/${roomId}/game/validClues`), validClues);
      await set(ref(db, `rooms/${roomId}/game/points`), score.points);
      await set(ref(db, `rooms/${roomId}/game/lostPoints`), score.lostPoints);
      await set(ref(db, `rooms/${roomId}/game/message`), "pass");
      await set(ref(db, `rooms/${roomId}/game/round`), nextRound);
      await set(
        ref(db, `rooms/${roomId}/game/answering`),
        getNextAnswering(nextRound, playerCount),
      );
      await set(ref(db, `rooms/${roomId}/game/phase`), "clue");
      await remove(ref(db, `rooms/${roomId}/game/clues`));
      await remove(ref(db, `rooms/${roomId}/game/guess`));
      return;
    }

    await set(ref(db, `rooms/${roomId}/game/invalidClues`), invalidClues);
    await set(ref(db, `rooms/${roomId}/game/validClues`), validClues);
    await set(ref(db, `rooms/${roomId}/game/phase`), "guess");
  }

  const clueEntries = Object.entries(clues).map(([id, text]) => ({
    playerId: Number(id),
    text,
    name: playerNames[Number(id)] || `Player ${id}`,
  }));

  return (
    <div className="text-center">
      <h2>{t("game.filteringClues")}</h2>

      <div className="card">
        {clueEntries.map(({ playerId, text, name }) => (
          <div
            key={playerId}
            onClick={() => toggleStrike(playerId)}
            style={{ cursor: "pointer", padding: "0.5rem" }}
          >
            <span className={`chip${struck.has(playerId) ? " chip--struck" : ""}`}>
              {text}
            </span>
            <span className="text-muted" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      <br />
      <button className="btn" onClick={handleSubmit}>
        {t("game.sendValidClues")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterClues.tsx
git commit -m "feat: add FilterClues component with tap-to-strike and auto-pass"
```

---

### Task 18: MakeGuess Component

**Files:**
- Modify: `src/components/MakeGuess.tsx`

- [ ] **Step 1: Write `src/components/MakeGuess.tsx`**

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface MakeGuessProps {
  roomId: string;
  validClues: string[];
  invalidCount: number;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function MakeGuess({
  roomId,
  validClues,
  invalidCount,
  answering,
  playerCount,
  round,
  points,
  lostPoints,
}: MakeGuessProps) {
  const { t } = useTranslation();
  const [guess, setGuess] = useState("");

  async function handleSubmit() {
    const trimmed = guess.trim();
    if (!trimmed) return;
    await set(ref(db, `rooms/${roomId}/game/guess`), trimmed);
    await set(ref(db, `rooms/${roomId}/game/phase`), "validate");
  }

  async function handlePass() {
    const score = calculateScore("pass", points, lostPoints);
    const nextRound = round + 1;

    await set(ref(db, `rooms/${roomId}/game/points`), score.points);
    await set(ref(db, `rooms/${roomId}/game/lostPoints`), score.lostPoints);
    await set(ref(db, `rooms/${roomId}/game/message`), "pass");
    await set(ref(db, `rooms/${roomId}/game/round`), nextRound);
    await set(
      ref(db, `rooms/${roomId}/game/answering`),
      getNextAnswering(nextRound, playerCount),
    );
    await set(ref(db, `rooms/${roomId}/game/phase`), "clue");
    await remove(ref(db, `rooms/${roomId}/game/clues`));
    await remove(ref(db, `rooms/${roomId}/game/invalidClues`));
    await remove(ref(db, `rooms/${roomId}/game/validClues`));
    await remove(ref(db, `rooms/${roomId}/game/guess`));
  }

  return (
    <div className="text-center">
      <div>
        {validClues.map((clue, i) => (
          <span key={i} className="chip">
            {clue}
          </span>
        ))}
      </div>

      {invalidCount > 0 && (
        <p className="text-muted">
          {t("game.discarded", { count: invalidCount })}
        </p>
      )}

      <input
        className="input"
        placeholder={t("game.enterGuess")}
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        maxLength={50}
      />

      <br />
      <br />

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button className="btn btn--outline" onClick={handlePass}>
          {t("game.pass")}
        </button>
        <button
          className="btn"
          onClick={handleSubmit}
          disabled={!guess.trim()}
        >
          {t("game.sendGuess")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MakeGuess.tsx
git commit -m "feat: add MakeGuess component with clue chips, guess input, and pass"
```

---

### Task 19: ValidateAnswer Component

**Files:**
- Modify: `src/components/ValidateAnswer.tsx`

- [ ] **Step 1: Write `src/components/ValidateAnswer.tsx`**

```typescript
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
  answering: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function ValidateAnswer({
  roomId,
  guess,
  word,
  answering,
  playerCount,
  round,
  points,
  lostPoints,
}: ValidateAnswerProps) {
  const { t } = useTranslation();

  async function handleResult(result: "right" | "wrong") {
    const score = calculateScore(result, points, lostPoints);
    const nextRound = round + 1;

    await set(ref(db, `rooms/${roomId}/game/points`), score.points);
    await set(ref(db, `rooms/${roomId}/game/lostPoints`), score.lostPoints);
    await set(ref(db, `rooms/${roomId}/game/message`), result);
    await set(ref(db, `rooms/${roomId}/game/round`), nextRound);
    await set(
      ref(db, `rooms/${roomId}/game/answering`),
      getNextAnswering(nextRound, playerCount),
    );
    await set(ref(db, `rooms/${roomId}/game/phase`), "clue");
    await remove(ref(db, `rooms/${roomId}/game/clues`));
    await remove(ref(db, `rooms/${roomId}/game/invalidClues`));
    await remove(ref(db, `rooms/${roomId}/game/validClues`));
    await remove(ref(db, `rooms/${roomId}/game/guess`));
  }

  return (
    <div className="text-center">
      <h2 className="text-heading">{word}</h2>

      <p className="text-large" style={{ margin: "1rem 0" }}>
        {guess}
      </p>

      <div className="validate-buttons">
        <button
          className="validate-btn validate-btn--correct"
          onClick={() => handleResult("right")}
          aria-label={t("game.correct")}
        >
          ✓
        </button>
        <button
          className="validate-btn validate-btn--wrong"
          onClick={() => handleResult("wrong")}
          aria-label={t("game.wrong")}
        >
          ✗
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ValidateAnswer.tsx
git commit -m "feat: add ValidateAnswer component with correct/wrong buttons"
```

---

### Task 20: FinishGame Component

**Files:**
- Modify: `src/components/FinishGame.tsx`

- [ ] **Step 1: Write `src/components/FinishGame.tsx`**

```typescript
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";

interface FinishGameProps {
  gameState: GameState;
}

export default function FinishGame({ gameState }: FinishGameProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function handlePlayAgain() {
    const room = createInitialRoom({
      minPlayers: 4,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), gameState.lang);
    navigate(`/room/${room.roomId}`);
  }

  return (
    <div className="text-center">
      <h1>{t("finish.gameOver")}</h1>

      <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} />

      <p className="text-large text-heading">
        {t("finish.score", { points: gameState.points })}
      </p>

      <button className="btn" onClick={handlePlayAgain}>
        {t("finish.playAgain")}
      </button>

      <button className="btn btn--outline" onClick={() => navigate("/join")}>
        {t("finish.joinAnother")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FinishGame.tsx
git commit -m "feat: add FinishGame component with score display and play again"
```

---

### Task 21: Clue Phase Auto-Transition

**Files:**
- Modify: `src/hooks/useGameState.ts`

The clue phase needs to auto-transition to "filter" when all non-guesser players have submitted clues. This is best handled reactively. We add a side-effect in useGameState that watches for the condition and writes the phase transition.

- [ ] **Step 1: Add auto-transition logic to `useGameState.ts`**

Add the following `useEffect` inside `useGameState`, after the existing `useEffect`:

```typescript
import { ref, onValue, set } from "firebase/database";

// ... existing code ...

// Auto-transition: clue → filter when all clues are in
useEffect(() => {
  if (!roomId) return;
  if (state.phase !== "clue") return;
  if (state.playerCount === 0) return;

  const clueCount = Object.keys(state.clues).length;
  const expectedClues = state.playerCount - 1; // everyone except guesser

  if (clueCount >= expectedClues && expectedClues > 0) {
    set(ref(db, `rooms/${roomId}/game/phase`), "filter");
  }
}, [roomId, state.phase, state.clues, state.playerCount]);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat: auto-transition from clue to filter phase when all clues submitted"
```

---

### Task 22: Firebase Game Cleanup on Finish

**Files:**
- Modify: `src/components/FinishGame.tsx`

The spec says game data is deleted from Firebase when the game ends. Add cleanup on mount.

- [ ] **Step 1: Add cleanup effect to `FinishGame.tsx`**

Add `roomId` as a prop and an effect:

```typescript
import { useEffect } from "react";

interface FinishGameProps {
  gameState: GameState;
  roomId: string;
}

export default function FinishGame({ gameState, roomId }: FinishGameProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Clean up game data from Firebase
    remove(ref(db, `rooms/${roomId}/game`));
  }, [roomId]);

  // ... rest unchanged
```

- [ ] **Step 2: Update PlayerPage to pass `roomId` to FinishGame**

In `src/pages/PlayerPage.tsx`, update the FinishGame usage:

```typescript
if (finished) {
  return <FinishGame gameState={gameState} roomId={roomId!} />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/FinishGame.tsx src/pages/PlayerPage.tsx
git commit -m "feat: delete game data from Firebase on game end"
```

---

### Task 23: End-to-End Manual Test

**Files:** None (verification only)

- [ ] **Step 1: Set up `.env` with Firebase credentials**

Copy `.env.example` to `.env` and fill in valid Firebase Realtime Database credentials.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Test the full game flow**

Open the app in a browser. Test:

1. **Home → Create game** — navigates to lobby, room code visible
2. **Lobby** — host enters nickname, joins as player 1, QR code shows
3. **Join flow** — open player URLs in separate tabs/devices, enter nicknames
4. **Start game** — with 4+ players ready, start game button works
5. **Clue phase** — non-guessers see the word and submit clues, guesser sees waiting message
6. **Auto-transition** — after all clues submitted, phase moves to "filter"
7. **Filter phase** — filter player can strike clues, submit valid clues
8. **Guess phase** — guesser sees valid clues, can guess or pass
9. **Validate phase** — validator confirms correct/wrong
10. **Scoring** — score dots update correctly
11. **Round advancement** — answering player rotates, new word appears
12. **Game end** — after 13 rounds or score fills, finish screen shows
13. **Play again** — creates new room, navigates to lobby
14. **Language** — switch to PT before creating game, all strings in Portuguese

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end testing"
```
