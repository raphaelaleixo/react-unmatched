import { useTranslation } from "react-i18next";
import type { GameState } from "../hooks/useGameState";
import { getFinishSubtitleKey, calculateFinalScore } from "../helpers/gameHelpers";
import ScoreTracker from "./ScoreTracker";

interface FinishGameProps {
  gameState: GameState;
}

export default function FinishGame({ gameState }: FinishGameProps) {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="lobby__room-code-text">{t("finish.gameOver")}</h1>
      <p className="text-large text-heading" style={{ textAlign: "center" }}>{t(getFinishSubtitleKey(calculateFinalScore(gameState.results)))}</p>
      <div className="card" style={{ margin: "0 auto", textAlign: "center" }}>
        <ScoreTracker results={gameState.results} />
        <p className="text-heading" style={{ fontWeight: 700, textTransform: "uppercase" }}>
          {t("finish.score", { score: calculateFinalScore(gameState.results) })}
        </p>
      </div>
    </>
  );
}
