import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RoomState } from "react-gameroom";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";
import AppHeader from "./AppHeader";

interface BigScreenGameProps {
  roomId: string;
  roomState: RoomState;
  gameState: GameState;
  playerNames: Record<number, string>;
  playerCount: number;
}

export default function BigScreenGame({ roomId, roomState, gameState, playerNames, playerCount }: BigScreenGameProps) {
  const { t, i18n } = useTranslation();
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  useEffect(() => {
    if (gameState.message) {
      setShowSnackbar(true);
      const timer = setTimeout(() => setShowSnackbar(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.message, gameState.round]);

  const guesserName =
    playerNames[gameState.answering] ||
    `Player ${gameState.answering}`;

  const isFinished =
    gameState.points + gameState.lostPoints >= 13 || gameState.round > 12;

  if (isFinished) {
    return (
      <div className="page">
        <AppHeader roomCode={roomId} roomState={roomState} />
        <h1>{t("finish.gameOver")}</h1>
        <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} />
        <p className="text-large text-heading">
          {t("finish.score", { points: gameState.points })}
        </p>
      </div>
    );
  }

  function phaseMessage(): string {
    switch (gameState.phase) {
      case "clue": {
        const clueCount = Object.keys(gameState.clues).length;
        const total = playerCount - 1;
        return t("game.cluesReceived", { count: clueCount, total });
      }
      case "filter":
        return t("game.filteringClues");
      case "guess":
        return t("game.waitingForGuess");
      case "validate":
        return t("game.validating");
      default:
        return "";
    }
  }

  return (
    <div className="page">
      <AppHeader roomCode={roomId} roomState={roomState} />

      <h2>{t("game.round", { current: gameState.round + 1 })}</h2>

      <p className="text-large">
        {guesserName}
      </p>

      <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} />

      <p className="text-muted">{phaseMessage()}</p>

      <div className="progress-bar" />

      {showSnackbar && gameState.message && (
        <div className="snackbar">{t(`result.${gameState.message}`)}</div>
      )}
    </div>
  );
}
