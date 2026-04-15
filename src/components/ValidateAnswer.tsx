import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
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

    await update(ref(db, `rooms/${roomId}/game`), {
      points: score.points,
      lostPoints: score.lostPoints,
      message: result,
      [`results/${round}`]: result,
      round: nextRound,
      answering: getNextAnswering(nextRound, playerCount),
      phase: "clue",
      clues: null,
      invalidClues: null,
      validClues: null,
      guess: null,
    });
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
