import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
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
    await update(ref(db, `rooms/${roomId}/game`), {
      guess: trimmed,
      phase: "validate",
    });
  }

  async function handlePass() {
    const score = calculateScore("pass", points, lostPoints);
    const nextRound = round + 1;

    await update(ref(db, `rooms/${roomId}/game`), {
      points: score.points,
      lostPoints: score.lostPoints,
      message: "pass",
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
    <div className="make-guess">
      <div className="make-guess__group">
        <div className="make-guess__header">
          <h2 className="make-guess__title">{t("game.guessTitle")}</h2>
          <p className="make-guess__instruction">{t("game.guessInstruction")}</p>
        </div>
      </div>

      <div className="make-guess__group">
        <div className="make-guess__clues">
          {validClues.map((clue, i) => (
            <div key={i} className="make-guess__clue-box">
              <span className="make-guess__clue-number">{t("game.clueNumber", { number: i + 1 })}</span>
              <span className="make-guess__clue-text">{clue}</span>
            </div>
          ))}
        </div>
        {invalidCount > 0 && (
          <p className="make-guess__discarded">
            {t("game.discarded", { count: invalidCount })}
          </p>
        )}
      </div>

      <div className="make-guess__group">
        <div className="make-guess__input-group">
          <label className="make-guess__label">{t("game.guessLabel")}</label>
          <input
            className="input"
            placeholder={t("game.enterGuess")}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={50}
          />
        </div>
        <div className="make-guess__buttons">
          <button className="btn btn--outline make-guess__btn-pass" onClick={handlePass}>
            {t("game.pass")}
          </button>
          <button
            className="btn make-guess__btn-submit"
            onClick={handleSubmit}
            disabled={!guess.trim()}
          >
            {t("game.sendGuess")}
          </button>
        </div>
      </div>
    </div>
  );
}
