/**
 * FilterClues — the duplicate-filtering phase UI shown to the filter player.
 *
 * The filter player (seated right after the guesser) reviews all submitted
 * clues and marks duplicates as invalid. Duplicate clues are auto-detected
 * and pre-struck on mount. The filter player can toggle each clue's status
 * before confirming.
 *
 * If every clue is struck, the round auto-passes (no clues for the guesser).
 * Otherwise the valid clues are sent to the guess phase.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
import { db } from "../firebase";
import { findDuplicateClueIds, parseClueKey, buildNextRoundUpdate } from "../helpers/gameHelpers";
import { useWordAutoScale } from "../hooks/useWordAutoScale";

interface FilterCluesProps {
  roomId: string;
  clues: Record<string, string>;
  playerNames: Record<number, string>;
  playerCount: number;
  round: number;
  word: string;
}

export default function FilterClues({
  roomId,
  clues,
  playerNames,
  playerCount,
  round,
  word,
}: FilterCluesProps) {
  const { t } = useTranslation();

  // Track which clue keys are "struck" (marked as invalid/duplicate)
  // Pre-populate with auto-detected duplicates
  const [struck, setStruck] = useState<Set<string>>(
    () => new Set(findDuplicateClueIds(clues)),
  );

  // Auto-scale the word text to fit its container
  const wordRef = useWordAutoScale(word);

  /** Toggle a clue between valid and invalid. */
  function toggleStrike(clueKey: string) {
    setStruck((prev) => {
      const next = new Set(prev);
      if (next.has(clueKey)) {
        next.delete(clueKey);
      } else {
        next.add(clueKey);
      }
      return next;
    });
  }

  /** Confirm the filter and advance — either to guess phase or auto-pass. */
  async function handleSubmit() {
    const invalidClues = Array.from(struck);
    const validClues = Object.entries(clues)
      .filter(([key]) => !struck.has(key))
      .map(([, clue]) => clue);

    // All clues struck → skip guess phase, count as a pass
    if (validClues.length === 0) {
      await update(ref(db, `rooms/${roomId}/game`), {
        ...buildNextRoundUpdate(round, playerCount, "pass", {
          [`clueHistory/${round}`]: clues,
        }),
        invalidClues,
        validClues,
      });
      return;
    }

    // At least one valid clue → move to guess phase
    await update(ref(db, `rooms/${roomId}/game`), {
      invalidClues,
      validClues,
      phase: "guess",
    });
  }

  // Build a flat list with player names for rendering
  const clueEntries = Object.entries(clues).map(([key, text]) => {
    const { playerId } = parseClueKey(key);
    return {
      clueKey: key,
      playerId,
      text,
      name: playerNames[playerId] || `Player ${playerId}`,
    };
  });

  return (
    <div className="filter-clues">
      <div className="filter-clues__group">
        {/* Secret word display — font auto-scales to fit */}
        <div className="filter-clues__word">
          <span className="filter-clues__word-label">{t("game.currentWord")}</span>
          <span ref={wordRef} className="filter-clues__word-value">{word}</span>
        </div>
        <p className="filter-clues__instruction">{t("game.filterInstruction")}</p>
      </div>

      <div className="filter-clues__group">
        {/* Clue list — each clue has accept/reject toggle buttons */}
        <div className="filter-clues__list">
          {clueEntries.map(({ clueKey, text, name }) => {
            const isStruck = struck.has(clueKey);
            return (
              <div key={clueKey} className="filter-clues__item">
                <div className="filter-clues__clue-info">
                  <span className={`filter-clues__clue-text${isStruck ? " filter-clues__clue-text--struck" : ""}`}>
                    {text}
                  </span>
                  <span className="filter-clues__clue-author">{name}</span>
                </div>
                <div className="filter-clues__actions">
                  <button
                    className={`filter-clues__action-btn filter-clues__action-btn--accept${!isStruck ? " filter-clues__action-btn--active" : ""}`}
                    onClick={() => isStruck && toggleStrike(clueKey)}
                    aria-label={t("game.correct")}
                  >
                    ✓
                  </button>
                  <button
                    className={`filter-clues__action-btn filter-clues__action-btn--reject${isStruck ? " filter-clues__action-btn--active" : ""}`}
                    onClick={() => !isStruck && toggleStrike(clueKey)}
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
