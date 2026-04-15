import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameState } from "../hooks/useGameState";

interface RoundResultOverlayProps {
  gameState: GameState;
  onVisibilityChange?: (visible: boolean) => void;
}

export default function RoundResultOverlay({ gameState, onVisibilityChange }: RoundResultOverlayProps) {
  const { t } = useTranslation();
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (gameState.message) {
      setShowResult(true);
      onVisibilityChange?.(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onVisibilityChange?.(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState.message, gameState.round]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showResult || !gameState.message) return null;

  return (
    <div className={`round-result-overlay round-result-overlay--${gameState.message}`}>
      <div className="round-result-overlay__content">
        <p className="round-result-overlay__label">
          {gameState.message === "duplicate"
            ? t("result.duplicate", { hint: Object.values(gameState.clueHistory[gameState.round - 1] ?? {})[0] ?? "" })
            : t(`result.${gameState.message}`)}
        </p>
        <div className="round-result-overlay__word">
          <span className="round-result-overlay__word-label">
            {t("result.theWord")}
          </span>
          <span className="round-result-overlay__word-text">
            {gameState.words[gameState.round - 1]}
          </span>
        </div>
        <div className="round-result-overlay__progress">
          <div className="round-result-overlay__progress-bar" />
        </div>
      </div>
    </div>
  );
}
