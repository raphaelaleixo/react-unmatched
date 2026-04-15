import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

interface SendClueProps {
  roomId: string;
  playerId: number;
  word: string;
  submitted: boolean;
  cluesCount: number;
  totalHinters: number;
}

export default function SendClue({
  roomId,
  playerId,
  word,
  submitted,
  cluesCount,
  totalHinters,
}: SendClueProps) {
  const { t } = useTranslation();
  const [clue, setClue] = useState("");
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

  async function handleSubmit() {
    const trimmed = clue.trim();
    if (!trimmed) return;
    await set(ref(db, `rooms/${roomId}/game/clues/${playerId}`), trimmed);
  }

  return (
    <div className="send-clue">
      <div className="send-clue__group">
        <div className="send-clue__word">
          <span className="send-clue__word-label">{t("game.currentWord")}</span>
          <span ref={wordRef} className="send-clue__word-value">{word}</span>
        </div>
        <p className="send-clue__instruction">{t("game.clueInstruction")}</p>
      </div>

      <div className="send-clue__group">
        <div className="send-clue__input-group">
          <label className="send-clue__label">{t("game.enterClue")}</label>
          <input
            className="input"
            placeholder={t("game.cluePlaceholder")}
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={30}
            disabled={submitted}
          />
        </div>

        <button
          className="btn send-clue__btn"
          onClick={handleSubmit}
          disabled={submitted || !clue.trim()}
        >
          {t("game.submitClue")}
        </button>

        <p className="send-clue__status">
          {t("game.playersReady", { count: cluesCount, total: totalHinters })}
        </p>
      </div>

    </div>
  );
}
