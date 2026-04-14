import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface FilterCluesProps {
  roomId: string;
  clues: Record<number, string>;
  playerNames: Record<number, string>;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function FilterClues({
  roomId,
  clues,
  playerNames,
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
