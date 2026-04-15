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

const PHASE_KEYS: Record<string, string> = {
  clue: "game.phase.hints",
  filter: "game.phase.filter",
  guess: "game.phase.guess",
  validate: "game.phase.validate",
};

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

  const activePlayers = roomState.players
    .filter((p) => p.status === "ready")
    .sort((a, b) => {
      if (a.id === gameState.answering) return -1;
      if (b.id === gameState.answering) return 1;
      return 0;
    });

  const roundDisplay = String(gameState.round + 1).padStart(2, "0");

  return (
    <div className="game-page">
      <AppHeader roomCode={roomId} roomState={roomState} />

      <div className="game-grid">
        <div className="game-grid__phase">
          {gameState.phase ? t(PHASE_KEYS[gameState.phase] ?? "") : ""}
        </div>

        <div className="game-grid__round">
          <span className="game-grid__round-label">{t("game.round.label")}</span>
          <span className="game-grid__round-value"><span className="game-grid__round-current">{roundDisplay}</span><span className="game-grid__round-total">/13</span></span>
        </div>

        <div className="game-grid__score">
          {Array.from({ length: 13 }, (_, i) => {
            let modifier = "";
            if (i < gameState.points) modifier = " game-circle--won";
            else if (i < gameState.points + gameState.lostPoints) modifier = " game-circle--lost";
            else if (i === gameState.points + gameState.lostPoints) modifier = " game-circle--current";
            const showNumber = i >= gameState.points + gameState.lostPoints;
            return <div key={i} className={`game-circle${modifier}`}>{showNumber && <span className="game-circle__number">{i + 1}</span>}</div>;
          })}
          <span className="game-legend__item"><span className="game-legend__dot game-circle--won" />{t("game.legend.won")}</span>
          <span className="game-legend__item"><span className="game-legend__dot game-circle--lost" />{t("game.legend.lost")}</span>
          <span className="game-legend__item"><span className="game-legend__dot" />{t("game.legend.upcoming")}</span>
        </div>

        <div className="game-grid__players">
          {activePlayers.map((player) => {
            const isGuesser = player.id === gameState.answering;
            const hasSubmitted =
              gameState.phase === "clue" &&
              !isGuesser &&
              gameState.clues[player.id] !== undefined;
            const name = playerNames[player.id] || player.name || `Player ${player.id}`;

            return (
              <div
                key={player.id}
                className={`game-player${isGuesser ? " game-player--guesser" : ""}`}
              >
                <span>{name}</span>
                {isGuesser && (
                  <span className="game-player__badge" style={{ background: "rgba(213, 147, 255, 0.15)", color: "var(--color-purple)" }}>
                    {t("game.role.guesser")}
                  </span>
                )}
                {!isGuesser && gameState.phase === "clue" && (
                  hasSubmitted ? (
                    <span className="game-player__badge">
                      {t("game.badge.submitted")}
                    </span>
                  ) : (
                    <span className="game-player__badge game-player__badge--thinking" style={{ animationDelay: `${player.id * 0.4}s` }}>
                      {t("game.badge.thinking")}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showSnackbar && gameState.message && (
        <div className="snackbar">{t(`result.${gameState.message}`)}</div>
      )}
    </div>
  );
}
