/**
 * BigScreenGame — the spectator / big-screen view shown on the lobby device
 * once the game has started.
 *
 * Displays: current phase label, round counter, 13-dot score visualization,
 * player list with status badges, and the round-result overlay.
 * Also shows the end-game summary with a "Play Again" button.
 */
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";
import AppHeader from "./AppHeader";
import RoundResultOverlay from "./RoundResultOverlay";
import PlayerBadge from "./PlayerBadge";
import { getFilterPlayer, isGameOver, getFinishSubtitleKey, calculateFinalScore, getCluesPerHinter, hasPlayerSubmittedAllClues } from "../helpers/gameHelpers";

interface BigScreenGameProps {
  roomId: string;
  roomState: RoomState;
  gameState: GameState;
  playerNames: Record<number, string>;
  playerCount: number;
}

// Maps game phase to translation key for the phase label
const PHASE_KEYS: Record<string, string> = {
  clue: "game.phase.hints",
  filter: "game.phase.filter",
  guess: "game.phase.guess",
  validate: "game.phase.validate",
};

export default function BigScreenGame({ roomId, roomState, gameState, playerNames, playerCount }: BigScreenGameProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  /** Create a brand-new room and navigate to it (keeps the same language). */
  async function handlePlayAgain() {
    await remove(ref(db, `rooms/${roomId}/game`));
    const room = createInitialRoom({
      minPlayers: 3,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), gameState.lang);
    navigate(`/room/${room.roomId}`);
  }

  const isFinished = isGameOver(gameState.round);

  // --- End-game screen ---
  if (isFinished) {
    return (
      <div className="page">
        <AppHeader roomCode={roomId} roomState={roomState} showFullscreen />
        <h1 className="lobby__room-code-text">{t("finish.gameOver")}</h1>
        <p className="text-large text-heading">{t(getFinishSubtitleKey(calculateFinalScore(gameState.results)))}</p>
        <div className="card" style={{ margin: "0 auto", textAlign: "center" }}>
          <ScoreTracker results={gameState.results} />
          <p className="text-heading" style={{ fontWeight: 700, textTransform: "uppercase" }}>
            {t("finish.score", { score: calculateFinalScore(gameState.results) })}
          </p>
        </div>
        <button className="btn" onClick={handlePlayAgain}>
          {t("finish.playAgain")}
        </button>
      </div>
    );
  }

  const cluesPerHinter = getCluesPerHinter(playerCount);

  // Sort players so the guesser always appears first in the list
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
      <AppHeader roomCode={roomId} roomState={roomState} showFullscreen />

      <div className="game-grid">
        {/* Current phase label (e.g. "Hints", "Filter", "Guess") */}
        <div className="game-grid__phase">
          <div className="game-grid__phase-title">
            {gameState.phase ? t(PHASE_KEYS[gameState.phase] ?? "") : ""}
          </div>
          <div className="game-grid__phase-subtitle">
            <Trans
              i18nKey="game.guesserLine"
              values={{ name: playerNames[gameState.answering] ?? "" }}
              components={{ bold: <strong className="game-grid__phase-guesser" /> }}
            />
          </div>
        </div>

        {/* Round counter: "01/13" through "13/13" */}
        <div className="game-grid__round">
          <span className="game-grid__round-label">{t("game.round.label")}</span>
          <span className="game-grid__round-value"><span className="game-grid__round-current">{roundDisplay}</span><span className="game-grid__round-total">/13</span></span>
        </div>

        {/* 13-dot score visualization — each dot shows the round outcome */}
        <div className="game-grid__score">
          {(() => {
            // Build an array of 13 dot types from the results so far
            const dots: ("won" | "lost" | "pass" | "current" | "neutral")[] = [];
            const sortedRounds = Object.keys(gameState.results)
              .map(Number)
              .sort((a, b) => a - b);

            for (const r of sortedRounds) {
              const result = gameState.results[r];
              if (result === "right") dots.push("won");
              else if (result === "wrong") dots.push("lost");
              else if (result === "pass") dots.push("pass");
            }

            // Mark the current round, fill remaining with neutral
            const filledCount = dots.length;
            if (filledCount < 13) dots.push("current");
            while (dots.length < 13) dots.push("neutral");

            return dots.slice(0, 13).map((type, i) => {
              const modifier = type !== "neutral" ? ` game-circle--${type}` : "";
              return <div key={i} className={`game-circle${modifier}`}><span className="game-circle__number">{i + 1}</span></div>;
            });
          })()}
          {/* Legend labels */}
          <div className="game-legend">
            <span className="game-legend__item"><span className="game-legend__dot game-circle--won" />{t("game.legend.won")}</span>
            <span className="game-legend__item"><span className="game-legend__dot game-circle--pass" />{t("game.legend.passed")}</span>
            <span className="game-legend__item"><span className="game-legend__dot game-circle--lost" />{t("game.legend.lost")}</span>
          </div>
        </div>

        {/* Player list with role/status badges */}
        <div className="game-grid__players">
          {activePlayers.map((player) => {
            const isGuesser = player.id === gameState.answering;
            const isFilterPlayer = player.id === getFilterPlayer(gameState.answering, playerCount);
            const hasSubmitted =
              gameState.phase === "clue" &&
              !isGuesser &&
              hasPlayerSubmittedAllClues(gameState.clues, player.id, cluesPerHinter);
            const name = playerNames[player.id] || player.name || `Player ${player.id}`;

            return (
              <div
                key={player.id}
                className={`game-player${isGuesser ? " game-player--guesser" : ""}`}
              >
                <span className="game-player__number">{player.id}</span>
                <span style={{ marginRight: "auto" }}>{name}</span>
                <PlayerBadge
                  phase={gameState.phase}
                  isGuesser={isGuesser}
                  isFilterPlayer={isFilterPlayer}
                  hasSubmitted={hasSubmitted}
                  playerId={player.id}
                />
              </div>
            );
          })}
        </div>
      </div>

      <RoundResultOverlay gameState={gameState} />
    </div>
  );
}
