import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface MakeGuessProps {
  roomId: string;
  validClues: string[];
  invalidCount: number;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function MakeGuess({
  roomId,
  validClues,
  invalidCount,
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
