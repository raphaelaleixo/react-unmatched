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
