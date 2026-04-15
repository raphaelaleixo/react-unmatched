import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set, update } from "firebase/database";
import { db } from "../firebase";
import { makeClueKey } from "../helpers/gameHelpers";

interface SendClueProps {
  roomId: string;
  playerId: number;
  word: string;
  submittedClueCount: number;
  cluesPerHinter: number;
  readyHinters: number;
  totalHinters: number;
}

export default function SendClue({
  roomId,
  playerId,
  word,
  submittedClueCount,
  cluesPerHinter,
  readyHinters,
  totalHinters,
}: SendClueProps) {
  const { t } = useTranslation();
  const [clues, setClues] = useState<string[]>(() =>
    Array.from({ length: cluesPerHinter }, () => ""),
  );
  const [submitted, setSubmitted] = useState(submittedClueCount >= cluesPerHinter);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSubmitted(submittedClueCount >= cluesPerHinter);
  }, [submittedClueCount, cluesPerHinter]);

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

  const allFilled = clues.every((c) => c.trim());

  async function handleSubmit() {
    if (!allFilled) return;

    if (cluesPerHinter === 1) {
      const key = makeClueKey(playerId, 0);
      await set(ref(db, `rooms/${roomId}/game/clues/${key}`), clues[0].trim());
    } else {
      const updates: Record<string, string> = {};
      for (let i = 0; i < cluesPerHinter; i++) {
        updates[`clues/${makeClueKey(playerId, i)}`] = clues[i].trim();
      }
      await update(ref(db, `rooms/${roomId}/game`), updates);
    }
    setSubmitted(true);
  }

  function updateClue(index: number, value: string) {
    setClues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <div className="send-clue">
      <div className="send-clue__group">
        <div className="send-clue__word">
          <span className="send-clue__word-label">{t("game.currentWord")}</span>
          <span ref={wordRef} className="send-clue__word-value">{word}</span>
        </div>
        <p className="send-clue__instruction">
          {cluesPerHinter >= 2 ? t("game.clueInstructionTwo") : t("game.clueInstruction")}
        </p>
      </div>

      <div className="send-clue__group">
        {clues.map((clue, i) => (
          <div key={i} className="send-clue__input-group">
            <label className="send-clue__label">
              {cluesPerHinter >= 2
                ? t("game.clueProgress", { current: i + 1, total: cluesPerHinter })
                : t("game.enterClue")}
            </label>
            <input
              className="input"
              placeholder={t("game.cluePlaceholder")}
              value={clue}
              onChange={(e) => updateClue(i, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && allFilled && handleSubmit()}
              maxLength={30}
              disabled={submitted}
            />
          </div>
        ))}

        <button
          className="btn send-clue__btn"
          onClick={handleSubmit}
          disabled={submitted || !allFilled}
        >
          {t("game.submitClue")}
        </button>

        <p className="send-clue__status">
          {t("game.playersReady", { count: readyHinters, total: totalHinters })}
        </p>
      </div>

    </div>
  );
}
