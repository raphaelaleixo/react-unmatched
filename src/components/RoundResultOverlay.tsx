import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameState } from "../hooks/useGameState";
import { parseClueKey } from "../helpers/gameHelpers";

interface RoundResultOverlayProps {
  gameState: GameState;
  playerNames: Record<number, string>;
  onVisibilityChange?: (visible: boolean) => void;
}

const DISMISS_MS = 8000;

export default function RoundResultOverlay({
  gameState,
  playerNames,
  onVisibilityChange,
}: RoundResultOverlayProps) {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (gameState.message) {
      setShowResult(true);
      onVisibilityChange?.(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onVisibilityChange?.(false);
      }, DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [gameState.message, gameState.round]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showResult || !gameState.message) return null;

  const finishedRound = gameState.round - 1;
  const word = gameState.words[finishedRound];
  const clues = gameState.clueHistory[finishedRound] ?? {};
  const invalidKeys = new Set(gameState.invalidCluesHistory[finishedRound] ?? []);
  const guess = gameState.guessHistory[finishedRound] ?? null;
  const guesserId = gameState.guesserHistory[finishedRound] ?? 0;
  const guesserName = playerNames[guesserId] ?? "";

  const clueEntries = Object.entries(clues).map(([key, text]) => {
    const { playerId } = parseClueKey(key);
    return {
      key,
      text,
      author: playerNames[playerId] ?? `Player ${playerId}`,
      struck: invalidKeys.has(key),
    };
  });

  return (
    <div className={`round-result-overlay round-result-overlay--${gameState.message}`}>
      <div className="round-result-overlay__content">
        <p className="round-result-overlay__label">
          {t(`result.${gameState.message}`)}
        </p>

        <div className="round-result-overlay__word">
          <span className="round-result-overlay__word-label">
            {t("result.theWord")}
          </span>
          <span className="round-result-overlay__word-text">{word}</span>
        </div>

        {gameState.message === "wrong" && guess && (
          <p className="round-result-overlay__guess">
            <span className="round-result-overlay__guess-label">
              {t("result.guessedBy", { name: guesserName })}
            </span>{" "}
            <span className="round-result-overlay__guess-text">{guess}</span>
          </p>
        )}

        {clueEntries.length > 0 && (
          <div className="round-result-overlay__clues">
            <p className="round-result-overlay__clues-header">
              {t("result.cluesHeader")}
            </p>
            <div className="round-result-overlay__chips">
              {clueEntries.map(({ key, text, author, struck }) => (
                <span
                  key={key}
                  className={`round-result-overlay__chip${struck ? " round-result-overlay__chip--struck" : ""}`}
                >
                  <span className="round-result-overlay__chip-text">{text}</span>
                  <span className="round-result-overlay__chip-author"> — {author}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="round-result-overlay__progress">
          <div className="round-result-overlay__progress-bar" />
        </div>
      </div>
    </div>
  );
}
