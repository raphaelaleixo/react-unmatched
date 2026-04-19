/**
 * SendClue — the clue-writing phase UI shown to each hinter (non-guesser).
 *
 * Players type 1 or 2 clues (depending on player count) to help the guesser
 * identify the secret word. Clues are written to Firebase individually so
 * the auto-transition in useGameState can detect when everyone is done.
 */
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ref, set, update } from "firebase/database";
import { db } from "../firebase";
import { makeClueKey } from "../helpers/gameHelpers";
import { useWordAutoScale } from "../hooks/useWordAutoScale";

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

  // One input per clue slot (1 or 2 depending on player count)
  const [clues, setClues] = useState<string[]>(() =>
    Array.from({ length: cluesPerHinter }, () => ""),
  );
  const [submitted, setSubmitted] = useState(submittedClueCount >= cluesPerHinter);
  const [pulseKey, setPulseKey] = useState(0);

  // Auto-scale the word text to fit its container
  const wordRef = useWordAutoScale(word);

  // Sync submitted state if the parent re-renders with updated clue count
  useEffect(() => {
    setSubmitted(submittedClueCount >= cluesPerHinter);
  }, [submittedClueCount, cluesPerHinter]);

  const allFilled = clues.every((c) => c.trim());
  const anyHasSpace = clues.some((c) => /\s/.test(c));

  /** Write clues to Firebase — single set() for 1 clue, batched update() for 2. */
  async function handleSubmit() {
    if (!allFilled) return;
    if (anyHasSpace) {
      setPulseKey((k) => k + 1);
      return;
    }

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
        {/* Secret word display — font auto-scales to fit */}
        <div className="send-clue__word">
          <span className="send-clue__word-label">{t("game.currentWord")}</span>
          <span ref={wordRef} className="send-clue__word-value">{word}</span>
        </div>
        <p
          key={pulseKey}
          className={`send-clue__instruction${anyHasSpace ? " send-clue__instruction--alert" : ""}`}
        >
          <Trans
            i18nKey={cluesPerHinter >= 2 ? "game.clueInstructionTwo" : "game.clueInstruction"}
            components={{ bold: <strong className="send-clue__one-word" /> }}
          />
        </p>
      </div>

      <div className="send-clue__group">
        {/* One input per clue slot */}
        {clues.map((clue, i) => (
          <div key={i} className="send-clue__input-group">
            <label className="send-clue__label">
              {cluesPerHinter >= 2
                ? t("game.clueProgress", { current: i + 1, total: cluesPerHinter })
                : t("game.enterClue")}
            </label>
            <input
              className={`input${/\s/.test(clue) ? " input--error" : ""}`}
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
