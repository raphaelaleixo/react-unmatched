import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
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
  word: string;
}

export default function FilterClues({
  roomId,
  clues,
  playerNames,
  playerCount,
  round,
  points,
  lostPoints,
  word,
}: FilterCluesProps) {
  const { t } = useTranslation();
  const [struck, setStruck] = useState<Set<number>>(new Set());
  const wordRef = useRef<HTMLSpanElement>(null);

  const fitWord = useCallback(() => {
    const el = wordRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    el.style.fontSize = "";
    const parentWidth = parent.clientWidth;
    const scrollWidth = el.scrollWidth;
    if (scrollWidth > 0) {
      const scale = parentWidth / scrollWidth;
      const baseFontSize = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${baseFontSize * scale}px`;
    }
  }, []);

  useEffect(() => {
    fitWord();
    window.addEventListener("resize", fitWord);
    return () => window.removeEventListener("resize", fitWord);
  }, [word, fitWord]);

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
      const score = calculateScore("pass", points, lostPoints);
      const nextRound = round + 1;

      await update(ref(db, `rooms/${roomId}/game`), {
        invalidClues,
        validClues,
        points: score.points,
        lostPoints: score.lostPoints,
        message: "pass",
        [`results/${round}`]: "pass",
        round: nextRound,
        answering: getNextAnswering(nextRound, playerCount),
        phase: "clue",
        clues: null,
        guess: null,
      });
      return;
    }

    await update(ref(db, `rooms/${roomId}/game`), {
      invalidClues,
      validClues,
      phase: "guess",
    });
  }

  const clueEntries = Object.entries(clues).map(([id, text]) => ({
    playerId: Number(id),
    text,
    name: playerNames[Number(id)] || `Player ${id}`,
  }));

  return (
    <div className="filter-clues">
      <div className="filter-clues__group">
        <div className="filter-clues__word">
          <span className="filter-clues__word-label">{t("game.currentWord")}</span>
          <span ref={wordRef} className="filter-clues__word-value">{word}</span>
        </div>
        <p className="filter-clues__instruction">{t("game.filterInstruction")}</p>
      </div>

      <div className="filter-clues__group">
        <div className="filter-clues__list">
          {clueEntries.map(({ playerId, text, name }) => {
            const isStruck = struck.has(playerId);
            return (
              <div key={playerId} className="filter-clues__item">
                <div className="filter-clues__clue-info">
                  <span className={`filter-clues__clue-text${isStruck ? " filter-clues__clue-text--struck" : ""}`}>
                    {text}
                  </span>
                  <span className="filter-clues__clue-author">{name}</span>
                </div>
                <div className="filter-clues__actions">
                  <button
                    className={`filter-clues__action-btn filter-clues__action-btn--accept${!isStruck ? " filter-clues__action-btn--active" : ""}`}
                    onClick={() => isStruck && toggleStrike(playerId)}
                    aria-label={t("game.correct")}
                  >
                    ✓
                  </button>
                  <button
                    className={`filter-clues__action-btn filter-clues__action-btn--reject${isStruck ? " filter-clues__action-btn--active" : ""}`}
                    onClick={() => !isStruck && toggleStrike(playerId)}
                    aria-label={t("game.wrong")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="filter-clues__group">
        <button className="btn filter-clues__btn" onClick={handleSubmit}>
          {t("game.sendValidClues")}
        </button>
      </div>
    </div>
  );
}
