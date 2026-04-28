# Custom Word Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the host paste a custom list of ≥13 words via a QR-linked phone page in the lobby; if present, the game uses those words instead of randomly picking from the default banks.

**Architecture:** Custom words live at `rooms/{roomId}/game/customWords` in Firebase RTDB — same path as the rest of the game data. The big-screen lobby reads them via the existing `useGameState` subscription (one new field added to its deserializer; no new listener). A new host-facing page at `/room/{roomId}/add-words` does a one-shot read of the room on mount (for room-existence, status, and pre-fill) and a leaf-path write on submit. **No react-gameroom library changes needed — this approach keeps all custom-word state inside the consumer app.**

**Tech Stack:** React 19, TypeScript 6, Firebase RTDB, Vitest + @testing-library/react, react-i18next, react-router-dom v6, react-gameroom 0.11.0 (npm-linked, unchanged).

---

## File Map

- Modify: `src/helpers/gameHelpers.ts` — add `parseWordList`, `findDuplicates`, `getGameWords`.
- Create: `src/helpers/gameHelpers.test.ts` — unit tests for the three new helpers.
- Modify: `src/locales/en.json` — add `addWords.*` block + `lobby.addCustomWords` and `lobby.customWordsLoaded`.
- Modify: `src/locales/pt_br.json` — same keys, Portuguese.
- Create: `src/components/AddWordsModal.tsx` — QR + URL hint + close button (used by `LobbyPage`).
- Create: `src/pages/AddWordsPage.tsx` — host-facing upload form.
- Create: `src/pages/AddWordsPage.test.tsx` — component tests (counter disable / duplicate warning / success view / not-found / already-started).
- Modify: `src/App.tsx` — register `/room/:roomId/add-words` route.
- Modify: `src/hooks/useGameState.ts` — add `customWords?: string[]` to `GameState` and the snapshot read.
- Modify: `src/pages/LobbyPage.tsx` — open-modal button, inline status chip, `onStart` uses `getGameWords`.
- Modify: `src/styles/index.css` — `.lobby__custom-words-button`, `.lobby__custom-words-status`, `.add-words-modal`, `.add-words-page` rules.

---

## Task 1: Add `parseWordList` helper (TDD)

**Files:**
- Create: `src/helpers/gameHelpers.test.ts`
- Modify: `src/helpers/gameHelpers.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/helpers/gameHelpers.test.ts` with this content:

```ts
import { describe, it, expect } from "vitest";
import { parseWordList } from "./gameHelpers";

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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: FAIL with "parseWordList is not exported" (or similar).

- [ ] **Step 3: Implement `parseWordList`**

Append to `src/helpers/gameHelpers.ts`:

```ts
/**
 * Split a raw textarea string into a normalized list of words.
 * Splits on newlines and commas, trims whitespace from each token, and drops
 * any empty tokens. Multi-word entries (e.g. "ice cream") are preserved.
 */
export function parseWordList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: 7 PASS for the `parseWordList` describe block.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/gameHelpers.ts src/helpers/gameHelpers.test.ts
git commit -m "feat(helpers): add parseWordList for custom word input"
```

---

## Task 2: Add `findDuplicates` helper (TDD)

**Files:**
- Modify: `src/helpers/gameHelpers.test.ts`
- Modify: `src/helpers/gameHelpers.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/helpers/gameHelpers.test.ts`:

```ts
import { findDuplicates } from "./gameHelpers";

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: FAIL with "findDuplicates is not exported".

- [ ] **Step 3: Implement `findDuplicates`**

Append to `src/helpers/gameHelpers.ts`:

```ts
/**
 * Return the values that appear more than once in `words` (case-insensitive).
 * Each duplicated value is returned only once, using the casing of its first
 * occurrence. Used to warn the host when a custom word list has duplicates.
 */
export function findDuplicates(words: string[]): string[] {
  const seen = new Map<string, string>();
  const dupes = new Set<string>();
  for (const word of words) {
    const key = word.toLowerCase();
    if (seen.has(key)) {
      dupes.add(seen.get(key)!);
    } else {
      seen.set(key, word);
    }
  }
  return Array.from(dupes);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: all `findDuplicates` and `parseWordList` tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/gameHelpers.ts src/helpers/gameHelpers.test.ts
git commit -m "feat(helpers): add findDuplicates with case-insensitive comparison"
```

---

## Task 3: Add `getGameWords` helper (TDD)

**Files:**
- Modify: `src/helpers/gameHelpers.test.ts`
- Modify: `src/helpers/gameHelpers.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/helpers/gameHelpers.test.ts`:

```ts
import { getGameWords } from "./gameHelpers";

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: FAIL with "getGameWords is not exported".

- [ ] **Step 3: Implement `getGameWords`**

Append to `src/helpers/gameHelpers.ts`:

```ts
/**
 * Choose the 13 words for an upcoming game.
 *
 * If a non-empty `customWords` array with at least 13 entries is provided,
 * those are shuffled and the first 13 are returned. Extras are dropped at game
 * start, which is intentional — submitting more than 13 gives randomization
 * across games. Otherwise we fall back to `pickWords(lang, 13)` against the
 * built-in word banks.
 */
export function getGameWords(
  customWords: string[] | undefined,
  lang: "en" | "pt_br",
): string[] {
  if (customWords && customWords.length >= 13) {
    return [...customWords].sort(() => Math.random() - 0.5).slice(0, 13);
  }
  return pickWords(lang, 13);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/helpers/gameHelpers.test.ts
```

Expected: all tests pass (parseWordList + findDuplicates + getGameWords).

- [ ] **Step 5: Commit**

```bash
git add src/helpers/gameHelpers.ts src/helpers/gameHelpers.test.ts
git commit -m "feat(helpers): add getGameWords selecting custom or default pool"
```

---

## Task 4: Add i18n keys for the upload feature

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/pt_br.json`

- [ ] **Step 1: Add `lobby.addCustomWords` and `lobby.customWordsLoaded` to the existing `lobby` block**

In `src/locales/en.json`, inside the `"lobby": { ... }` object, add the following two keys (position within the lobby block doesn't matter):

```json
"addCustomWords": "+ Add custom words",
"customWordsLoaded": "✓ {{count}} custom words loaded"
```

In `src/locales/pt_br.json`, inside the `"lobby": { ... }` object, add:

```json
"addCustomWords": "+ Adicionar palavras",
"customWordsLoaded": "✓ {{count}} palavras carregadas"
```

- [ ] **Step 2: Add the `addWords` block at the end of each locale file**

In `src/locales/en.json`, add (as a sibling of `lobby`):

```json
"addWords": {
  "title": "Custom words",
  "subtitleRoom": "Room {{code}}",
  "instructions": "Paste at least 13 words. Separate by line breaks or commas.",
  "textareaLabel": "Words",
  "textareaPlaceholder": "apple\nbanana\ncherry, date\n...",
  "counter": "{{count}} / 13 words",
  "duplicatesWarning": "Duplicates found: {{words}}",
  "tooFewWarning": "Need at least 13 words (have {{count}}).",
  "submit": "Send to lobby",
  "submitting": "Sending…",
  "submitError": "Couldn't save. Please try again.",
  "successTitle": "✓ Words sent",
  "successBody": "{{count}} words are loaded in the lobby. You can close this tab.",
  "editAgain": "Edit list",
  "alreadyStartedTitle": "Game already in progress",
  "alreadyStartedBody": "You can't change the words once the game has started.",
  "backHome": "Back to home"
}
```

In `src/locales/pt_br.json`, add the parallel block (as a sibling of `lobby`):

```json
"addWords": {
  "title": "Palavras personalizadas",
  "subtitleRoom": "Sala {{code}}",
  "instructions": "Cole ao menos 13 palavras. Separe por quebras de linha ou vírgulas.",
  "textareaLabel": "Palavras",
  "textareaPlaceholder": "maçã\nbanana\ncereja, tâmara\n...",
  "counter": "{{count}} / 13 palavras",
  "duplicatesWarning": "Duplicatas encontradas: {{words}}",
  "tooFewWarning": "São necessárias ao menos 13 palavras (tem {{count}}).",
  "submit": "Enviar para a sala",
  "submitting": "Enviando…",
  "submitError": "Não foi possível salvar. Tente novamente.",
  "successTitle": "✓ Palavras enviadas",
  "successBody": "{{count}} palavras carregadas na sala. Pode fechar esta aba.",
  "editAgain": "Editar lista",
  "alreadyStartedTitle": "Jogo em andamento",
  "alreadyStartedBody": "Não dá para mudar as palavras depois que o jogo começou.",
  "backHome": "Voltar ao início"
}
```

- [ ] **Step 3: Verify both files still parse as valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json', 'utf8')); JSON.parse(require('fs').readFileSync('src/locales/pt_br.json', 'utf8')); console.log('OK')"
```

Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/pt_br.json
git commit -m "i18n: add addWords and lobby.customWords keys (en + pt_br)"
```

---

## Task 5: Build `AddWordsModal` component

**Files:**
- Create: `src/components/AddWordsModal.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/AddWordsModal.tsx` with this content:

```tsx
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { RoomQRCode } from "react-gameroom";

interface AddWordsModalProps {
  open: boolean;
  roomId: string;
  onClose: () => void;
}

function buildAddWordsUrl(roomId: string): string {
  if (typeof window === "undefined") return `/room/${roomId}/add-words`;
  return `${window.location.origin}/room/${roomId}/add-words`;
}

export default function AddWordsModal({ open, roomId, onClose }: AddWordsModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const url = buildAddWordsUrl(roomId);

  return (
    <dialog
      ref={dialogRef}
      className="add-words-modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="add-words-modal__content">
        <h2 className="add-words-modal__title">{t("addWords.title")}</h2>
        <p className="add-words-modal__hint">{t("addWords.instructions")}</p>
        <div className="add-words-modal__qr">
          <RoomQRCode roomId={roomId} url={url} size={220} />
        </div>
        <p className="add-words-modal__url">{url}</p>
        <button type="button" className="btn btn--outline" onClick={onClose}>
          {t("rules.back")}
        </button>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
npx tsc -b
```

Expected: exits 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AddWordsModal.tsx
git commit -m "feat(component): add AddWordsModal with QR and URL hint"
```

---

## Task 6: Build `AddWordsPage` component (TDD)

**Files:**
- Create: `src/pages/AddWordsPage.test.tsx`
- Create: `src/pages/AddWordsPage.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/AddWordsPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../i18n";
import AddWordsPage from "./AddWordsPage";

const mockGet = vi.fn();
const mockSet = vi.fn();
vi.mock("firebase/database", () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  get: (...args: unknown[]) => mockGet(...args),
  set: (...args: unknown[]) => mockSet(...args),
}));
vi.mock("../firebase", () => ({ db: {} }));

function renderPage(roomId = "ROOM1") {
  return render(
    <MemoryRouter initialEntries={[`/room/${roomId}/add-words`]}>
      <Routes>
        <Route path="/room/:roomId/add-words" element={<AddWordsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function snapshot(value: unknown) {
  return { val: () => value, exists: () => value !== null && value !== undefined };
}

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
});

describe("AddWordsPage", () => {
  it("disables submit while fewer than 13 unique words are entered", async () => {
    mockGet.mockResolvedValue(
      snapshot({
        state: {
          roomId: "ROOM1",
          status: "lobby",
          players: [],
          config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
        },
        game: null,
      }),
    );

    renderPage();
    const textarea = await screen.findByLabelText(/words|palavras/i);
    const submit = screen.getByRole("button", { name: /send to lobby|enviar para a sala/i });

    fireEvent.change(textarea, { target: { value: "a\nb\nc" } });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/3 \/ 13/)).toBeInTheDocument();
  });

  it("shows a duplicate warning and prevents submit when duplicates are present", async () => {
    mockGet.mockResolvedValue(
      snapshot({
        state: {
          roomId: "ROOM1",
          status: "lobby",
          players: [],
          config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
        },
        game: null,
      }),
    );

    renderPage();
    const textarea = await screen.findByLabelText(/words|palavras/i);

    const value =
      "apple\nbanana\ncherry\ndate\nelderberry\nfig\ngrape\nhoneydew\nimbe\njackfruit\nkiwi\nlemon\nApple";
    fireEvent.change(textarea, { target: { value } });

    expect(
      screen.getByText(/duplicates found|duplicatas encontradas/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send to lobby|enviar para a sala/i }),
    ).toBeDisabled();
  });

  it("submits the parsed list to firebase and shows the success view", async () => {
    mockGet.mockResolvedValue(
      snapshot({
        state: {
          roomId: "ROOM1",
          status: "lobby",
          players: [],
          config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
        },
        game: null,
      }),
    );
    mockSet.mockResolvedValue(undefined);

    renderPage();
    const textarea = await screen.findByLabelText(/words|palavras/i);

    const thirteen = Array.from({ length: 13 }, (_, i) => `word${i}`).join("\n");
    fireEvent.change(textarea, { target: { value: thirteen } });

    const submit = screen.getByRole("button", { name: /send to lobby|enviar para a sala/i });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledTimes(1);
    });
    const [refArg, valueArg] = mockSet.mock.calls[0];
    expect(refArg).toEqual({ path: "rooms/ROOM1/game/customWords" });
    expect(valueArg).toEqual(
      Array.from({ length: 13 }, (_, i) => `word${i}`),
    );

    expect(
      await screen.findByText(/words sent|palavras enviadas/i),
    ).toBeInTheDocument();
  });

  it("pre-fills the textarea with existing customWords (one per line)", async () => {
    const existing = Array.from({ length: 14 }, (_, i) => `pre${i}`);
    mockGet.mockResolvedValue(
      snapshot({
        state: {
          roomId: "ROOM1",
          status: "lobby",
          players: [],
          config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
        },
        game: { customWords: existing },
      }),
    );

    renderPage();
    const textarea = (await screen.findByLabelText(/words|palavras/i)) as HTMLTextAreaElement;
    expect(textarea.value).toBe(existing.join("\n"));
  });

  it("shows the already-started view when state.status is 'started'", async () => {
    mockGet.mockResolvedValue(
      snapshot({
        state: {
          roomId: "ROOM1",
          status: "started",
          players: [],
          config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
        },
        game: { words: [], round: 0 },
      }),
    );

    renderPage();
    expect(
      await screen.findByText(/game already in progress|jogo em andamento/i),
    ).toBeInTheDocument();
  });

  it("shows the not-found view when the room does not exist", async () => {
    mockGet.mockResolvedValue(snapshot(null));

    renderPage();
    expect(
      await screen.findByText(/room not found|sala não encontrada/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/AddWordsPage.test.tsx
```

Expected: FAIL with "Cannot find module './AddWordsPage'".

- [ ] **Step 3: Implement the page**

Create `src/pages/AddWordsPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import AppHeader from "../components/AppHeader";
import { parseWordList, findDuplicates } from "../helpers/gameHelpers";

type LoadState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "started" }
  | { kind: "ready" };

const MIN_WORDS = 13;

export default function AddWordsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      const snap = await get(ref(db, `rooms/${roomId}`));
      if (cancelled) return;
      const value = snap.val() as
        | { state?: { status?: string }; game?: { customWords?: string[] } }
        | null;
      if (!value || !value.state) {
        setLoad({ kind: "not-found" });
        return;
      }
      if (value.state.status === "started") {
        setLoad({ kind: "started" });
        return;
      }
      const existing = value.game?.customWords ?? [];
      setText(existing.join("\n"));
      setLoad({ kind: "ready" });
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const parsed = useMemo(() => parseWordList(text), [text]);
  const duplicates = useMemo(() => findDuplicates(parsed), [parsed]);
  const canSubmit =
    !submitting &&
    duplicates.length === 0 &&
    parsed.length >= MIN_WORDS &&
    submittedCount === null;

  async function handleSubmit() {
    if (!roomId || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await set(ref(db, `rooms/${roomId}/game/customWords`), parsed);
      setSubmittedCount(parsed.length);
    } catch {
      setSubmitError(t("addWords.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (load.kind === "loading") {
    return (
      <div className="page">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (load.kind === "not-found") {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="player-join">
          <h2 className="player-join__title text-center">{t("lobby.roomNotFound")}</h2>
          <button className="btn" onClick={() => navigate("/")}>{t("addWords.backHome")}</button>
        </div>
      </div>
    );
  }

  if (load.kind === "started") {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="player-join">
          <h2 className="player-join__title text-center">{t("addWords.alreadyStartedTitle")}</h2>
          <p className="text-muted text-center">{t("addWords.alreadyStartedBody")}</p>
          <button className="btn" onClick={() => navigate("/")}>{t("addWords.backHome")}</button>
        </div>
      </div>
    );
  }

  if (submittedCount !== null) {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="add-words-page__success">
          <h2>{t("addWords.successTitle")}</h2>
          <p>{t("addWords.successBody", { count: submittedCount })}</p>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setSubmittedCount(null)}
          >
            {t("addWords.editAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page add-words-page">
      <AppHeader />
      <div className="add-words-page__content">
        <header>
          <h2>{t("addWords.title")}</h2>
          <p className="text-muted">{t("addWords.subtitleRoom", { code: roomId })}</p>
        </header>
        <p>{t("addWords.instructions")}</p>
        <label htmlFor="add-words-textarea" className="input-label">
          {t("addWords.textareaLabel")}
        </label>
        <textarea
          id="add-words-textarea"
          className="input add-words-page__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("addWords.textareaPlaceholder")}
          rows={12}
          autoFocus
        />
        <p
          className={
            parsed.length >= MIN_WORDS
              ? "add-words-page__counter add-words-page__counter--ok"
              : "add-words-page__counter"
          }
        >
          {t("addWords.counter", { count: parsed.length })}
        </p>
        {duplicates.length > 0 && (
          <p className="add-words-page__warning">
            {t("addWords.duplicatesWarning", { words: duplicates.join(", ") })}
          </p>
        )}
        {parsed.length > 0 && parsed.length < MIN_WORDS && duplicates.length === 0 && (
          <p className="add-words-page__warning">
            {t("addWords.tooFewWarning", { count: parsed.length })}
          </p>
        )}
        {submitError && <p className="text-error">{submitError}</p>}
        <button
          type="button"
          className="btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? t("addWords.submitting") : t("addWords.submit")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pages/AddWordsPage.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AddWordsPage.tsx src/pages/AddWordsPage.test.tsx
git commit -m "feat(page): add AddWordsPage for host-side custom word upload"
```

---

## Task 7: Register the `/room/:roomId/add-words` route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the import**

In `src/App.tsx`, add this import alongside the others (e.g. just below the `RulesPage` import):

```tsx
import AddWordsPage from "./pages/AddWordsPage";
```

- [ ] **Step 2: Insert the new `Route` before the catch-all**

Insert this `Route` line *immediately above* the existing `<Route path="/room/:roomId/*" element={<PageTransition><RoomFallback /></PageTransition>} />` line:

```tsx
<Route path="/room/:roomId/add-words" element={<PageTransition><AddWordsPage /></PageTransition>} />
```

The order matters — react-router v6 picks the first matching route, and the catch-all must remain last.

- [ ] **Step 3: Verify typecheck and tests still pass**

```bash
npx tsc -b && npx vitest run
```

Expected: typecheck exits 0; all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): register /room/:roomId/add-words"
```

---

## Task 8: Extend `useGameState` to expose `customWords`

**Files:**
- Modify: `src/hooks/useGameState.ts`

- [ ] **Step 1: Add `customWords` to the `GameState` interface**

In `src/hooks/useGameState.ts`, find the `GameState` interface (around lines 24-37). Add this field at the end of the interface (after the `lang` line):

```ts
  customWords?: string[];                               // optional host-uploaded list (>=13)
```

- [ ] **Step 2: Add `customWords` to `INITIAL_STATE`**

In the same file, find the `INITIAL_STATE` object (around lines 39-52). Add this field at the end (after `lang: "en"`):

```ts
  customWords: undefined,
```

- [ ] **Step 3: Add `customWords` to the snapshot deserializer**

In the same file, find the `setState({...})` call inside the `onValue` listener (around lines 70-83). Add this field at the end (after the `lang:` line):

```ts
        customWords: data.customWords ?? undefined,
```

The result should look like:

```ts
      setState({
        phase: data.phase ?? null,
        round: data.round ?? 0,
        words: data.words ?? [],
        answering: data.answering ?? 0,
        clues: data.clues ?? {},
        invalidClues: data.invalidClues ?? [],
        validClues: data.validClues ?? [],
        guess: data.guess ?? null,
        message: data.message ?? null,
        clueHistory: data.clueHistory ?? {},
        results: data.results ?? {},
        lang: data.lang ?? "en",
        customWords: data.customWords ?? undefined,
      });
```

- [ ] **Step 4: Verify typecheck still passes**

```bash
npx tsc -b
```

Expected: exits 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat(hooks): expose customWords on useGameState"
```

---

## Task 9: Wire the lobby — button, modal, status chip, `getGameWords`

**Files:**
- Modify: `src/pages/LobbyPage.tsx`

- [ ] **Step 1: Update imports**

In `src/pages/LobbyPage.tsx`, replace the existing import block (lines 1-16) with:

```tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import {
  PlayerSlotsGrid,
  RoomQRCode,
  StartGameButton,
  useRoomState,
  buildJoinUrl,
} from "react-gameroom";
import { db } from "../firebase";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { getGameWords } from "../helpers/gameHelpers";
import BigScreenGame from "../components/BigScreenGame";
import AppHeader from "../components/AppHeader";
import AddWordsModal from "../components/AddWordsModal";
```

(Two changes: drop the `pickWords` import, add `useState`, swap to `getGameWords`, add `AddWordsModal`.)

- [ ] **Step 2: Add modal state**

Inside the `LobbyPage` function body, just below the existing `const navigate = useNavigate();` line, add:

```tsx
  const [addWordsOpen, setAddWordsOpen] = useState(false);
```

- [ ] **Step 3: Replace the `lobby__actions` block (this swaps `pickWords` for `getGameWords` and adds the new button + chip)**

Locate the entire `lobby__actions` block (currently around lines 95-124). Replace it with:

```tsx
        <div className="lobby__actions">
          <p className="lobby__player-count">
            {t("lobby.playersReady", {
              count: derived.readyCount,
              max: roomState.config.maxPlayers,
              min: roomState.config.minPlayers,
            })}
          </p>
          <StartGameButton
            roomState={roomState}
            className="btn"
            labels={{ start: t("lobby.startGame") }}
            onStart={async (newState) => {
              const lang = (gameState.lang || "en") as "en" | "pt_br";
              const words = getGameWords(gameState.customWords, lang);
              const firstAnswering = Math.floor(Math.random() * derived.playerCount) + 1;
              await set(ref(db, `rooms/${roomId}/game`), {
                words,
                round: 0,
                answering: firstAnswering,
                phase: "clue",
                message: null,
                lang,
              });
              await updateRoom(newState);
            }}
          />
          <button
            type="button"
            className="btn btn--outline lobby__custom-words-button"
            onClick={() => setAddWordsOpen(true)}
          >
            {t("lobby.addCustomWords")}
          </button>
          {(gameState.customWords?.length ?? 0) >= 13 && (
            <p className="lobby__custom-words-status">
              {t("lobby.customWordsLoaded", {
                count: gameState.customWords!.length,
              })}
            </p>
          )}
        </div>
```

Note: this intentionally **drops the existing `customWords`-clearing on Start**. The previous `set(ref(db, 'rooms/{id}/game'), { words, ..., lang })` overwrites the entire `game` subtree, which means the `customWords` written by the upload page get wiped at game start. That's fine — they've already been consumed by `getGameWords`.

- [ ] **Step 4: Render the modal at the end of the lobby JSX**

Just before the final closing `</div>` (the `lobby` wrapper), add:

```tsx
      <AddWordsModal
        open={addWordsOpen}
        roomId={roomState.roomId}
        onClose={() => setAddWordsOpen(false)}
      />
```

- [ ] **Step 5: Verify typecheck and existing tests still pass**

```bash
npx tsc -b && npx vitest run
```

Expected: typecheck exits 0; all existing tests pass (including new ones).

- [ ] **Step 6: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat(lobby): add custom words button, modal, status chip, getGameWords"
```

---

## Task 10: CSS for new elements

**Files:**
- Modify: `src/styles/index.css`

> **Important:** before editing, read the full existing rule(s) in this file for any selector you intend to extend (project convention to avoid CSS conflicts).

- [ ] **Step 1: Append the new rules to `src/styles/index.css`**

Append this block at the end of the file:

```css
/* Lobby — custom words */
.lobby__custom-words-button {
  font-size: clamp(0.875rem, 1.2vw, 1rem);
  padding: 0.75em 1.75em;
  align-self: flex-start;
}

.lobby__custom-words-status {
  font-size: clamp(0.875rem, 1.2vw, 1rem);
  color: var(--color-cyan);
  font-weight: 500;
}

/* Add Words Modal */
.add-words-modal {
  border: none;
  border-radius: 16px;
  padding: 0;
  background: var(--color-surface);
  color: var(--color-text);
  max-width: 90vw;
}

.add-words-modal::backdrop {
  background: rgba(16, 13, 21, 0.75);
}

.add-words-modal__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem;
  max-width: 360px;
}

.add-words-modal__title {
  font-size: 1.5rem;
}

.add-words-modal__hint {
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.95rem;
}

.add-words-modal__qr {
  background: #fff;
  padding: 0.75rem;
  border-radius: 12px;
}

.add-words-modal__url {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  word-break: break-all;
  text-align: center;
}

/* Add Words Page */
.add-words-page {
  align-items: stretch;
}

.add-words-page__content {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-words-page__textarea {
  min-height: 240px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 1rem;
  resize: vertical;
}

.add-words-page__counter {
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.add-words-page__counter--ok {
  color: var(--color-cyan);
  font-weight: 500;
}

.add-words-page__warning {
  color: var(--color-red);
  font-size: 0.95rem;
}

.add-words-page__success {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
```

- [ ] **Step 2: Verify the dev build still works**

```bash
npm run build
```

Expected: build succeeds, no CSS or TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "style: add styles for custom words button, modal, and upload page"
```

---

## Task 11: Manual smoke test in the browser (USER-RUN)

**Files:** none

This task is required by project convention — UI features must be exercised in a browser before the work is considered complete. The user runs this; it's not for a subagent.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Note the URL printed (typically `http://localhost:5173` or similar).

- [ ] **Step 2: Walk the golden path**

1. Open the dev URL in a browser. Click "Create New Game". Note the room code.
2. Click "+ Add custom words" — confirm the modal opens with a QR code and the text URL `<origin>/room/{CODE}/add-words`.
3. In a second tab, navigate to that URL directly. Confirm:
   - The page renders with the textarea, counter showing `0 / 13 words`, and the submit button disabled.
   - The textarea is empty (no prior list).
4. Paste 13 words separated by mixed delimiters (some newlines, some commas). Confirm:
   - The counter ticks up to `13 / 13 words` and turns the cyan/highlighted style.
   - The submit button enables.
5. Click "Send to lobby". Confirm:
   - The success view appears.
   - On the original lobby tab, the chip "✓ 13 custom words loaded" appears below the buttons within ~1s.
6. In the upload tab, click "Edit list". Confirm the textarea is pre-filled with one word per line.
7. Edit the list to have only 5 words. Confirm:
   - Counter shows `5 / 13`.
   - Submit is disabled.
   - The "Need at least 13 words" warning appears.
8. Add 8 more words, with one duplicate (case-insensitive). Confirm:
   - The duplicate warning lists the duplicated word.
   - Submit is disabled.
9. Remove the duplicate, re-submit, and on the lobby tab confirm the chip count updates.
10. Back on the lobby, click "Start Game". Open the Firebase console (or temporarily log `gameState.words` from `useGameState`) and verify the 13 words written under `rooms/{CODE}/game/words` are a subset of the custom list (NOT from the default English/Portuguese banks).

- [ ] **Step 3: Walk the regression path (default fallback)**

1. Create a new room.
2. Skip the upload entirely and click Start Game.
3. Verify the game proceeds normally (the 13 round words come from the default bank for the selected language).

- [ ] **Step 4: Walk the edge cases**

1. Visit `/room/INVALID/add-words` for a code that does not exist. Confirm: room-not-found UI with a back-home button.
2. Create a room, click Start Game, then visit `/room/{CODE}/add-words`. Confirm: "game already in progress" UI with a back-home button.

---

## Self-Review Notes

**Spec coverage:**
- Replace defaults entirely → Task 3 (`getGameWords` only uses customWords; never mixes).
- Hard min 13, reject if fewer → Task 6 (submit disabled until parsed.length ≥ 13) + Task 3 (fallback if <13).
- Initial lobby only → Task 6 ("started" branch).
- Optional, falls back to defaults → Task 3.
- Paste split on newlines + commas → Task 1 (`parseWordList`).
- Duplicates: warn + prevent submit, case-insensitive → Tasks 2 + 6.
- Re-edit pre-fills with `array.join("\n")` → Task 6 (`useEffect` initializer + dedicated test).
- Language independence → Task 3 (lang only used for fallback bank).
- Lobby small button + status chip → Task 9.
- Game-already-started edge → Task 6.
- Room-not-found edge → Task 6.
- No cleanup needed → handled by user's daily DB sweep + the existing Start handler overwrites the `game` subtree (which was the storage location for `customWords`).
- No react-gameroom lib changes — by design (option B / game-state architecture).

**Placeholder scan:** none — all code blocks are complete.

**Type consistency:** `getGameWords(customWords, lang)` signature is consistent across the helper, its tests, and the LobbyPage call site. `customWords?: string[]` matches between `GameState`, the helper input, the page write payload, and the chip read.
