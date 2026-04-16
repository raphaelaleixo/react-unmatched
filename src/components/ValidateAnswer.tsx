/**
 * ValidateAnswer — the validation phase UI shown to the filter player.
 *
 * After the guesser submits their answer, the filter player sees both the
 * secret word and the guess side-by-side. They judge whether the guess is
 * close enough to count as correct (+1 pt) or wrong (−2 pts).
 *
 * Note: exact matches are auto-validated in useGameState, so this screen
 * only appears for guesses that don't match the word letter-for-letter.
 */
import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { buildNextRoundUpdate } from "../helpers/gameHelpers";

interface ValidateAnswerProps {
  roomId: string;
  guess: string;
  word: string;
  guesserName: string;
  clues: Record<string, string>;
  playerCount: number;
  round: number;
}

export default function ValidateAnswer({
  roomId,
  guess,
  word,
  guesserName,
  clues,
  playerCount,
  round,
}: ValidateAnswerProps) {
  const { t } = useTranslation();

  /** Record the result and advance to the next round. */
  async function handleResult(result: "right" | "wrong") {
    await update(ref(db, `rooms/${roomId}/game`), {
      ...buildNextRoundUpdate(round, playerCount, result, {
        [`clueHistory/${round}`]: clues,
      }),
      invalidClues: null,
      validClues: null,
    });
  }

  return (
    <div className="validate-answer">
      <h2 className="validate-answer__title">{t("game.validate.title")}</h2>

      {/* Side-by-side cards showing the word and the guess */}
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

      {/* Correct / Wrong buttons with point values */}
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
