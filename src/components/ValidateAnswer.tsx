import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { calculateScore, getNextAnswering } from "../helpers/gameHelpers";

interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
  guesserName: string;
  playerCount: number;
  round: number;
  points: number;
  lostPoints: number;
}

export default function ValidateAnswer({
  roomId,
  guess,
  word,
  guesserName,
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
    <div className="validate-answer">
      <h2 className="validate-answer__title">{t("game.validate.title")}</h2>
      <div className="validate-answer__cards">
        <div className="validate-answer__card validate-answer__card--word">
          <span className="validate-answer__card-label">{t("game.validate.wordWas")}</span>
          <span className="validate-answer__card-text">{word}</span>
        </div>
        <div className="validate-answer__card validate-answer__card--guess">
          <span className="validate-answer__card-label">{t("game.validate.guessed", { name: guesserName })}</span>
          <span className="validate-answer__card-text">{guess}</span>
        </div>
      </div>

      <div className="validate-answer__group">
        <div className="validate-buttons">
          <button
            className="validate-btn validate-btn--correct"
            onClick={() => handleResult("right")}
            aria-label={t("game.correct")}
          >
            <span className="validate-btn__label">{t("game.correct")}</span>
            <span className="validate-btn__score">+ 1 pt</span>
          </button>
          <button
            className="validate-btn validate-btn--wrong"
            onClick={() => handleResult("wrong")}
            aria-label={t("game.wrong")}
          >
            <span className="validate-btn__label">{t("game.wrong")}</span>
            <span className="validate-btn__score">- 2 pts</span>
          </button>
        </div>
      </div>

      <p className="validate-answer__hint">{t("game.validate.hint")}</p>
    </div>
  );
}
