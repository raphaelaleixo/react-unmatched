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
