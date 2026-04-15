import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";
import AppHeader from "./AppHeader";
import RoundResultOverlay from "./RoundResultOverlay";
import { getFilterPlayer, isGameOver, getFinishSubtitleKey, calculateFinalScore, getCluesPerHinter, hasPlayerSubmittedAllClues } from "../helpers/gameHelpers";

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
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  if (isFinished) {
    return (
      <div className="page">
        <AppHeader roomCode={roomId} roomState={roomState} />
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
          {(() => {
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

            const filledCount = dots.length;
            if (filledCount < 13) dots.push("current");
            while (dots.length < 13) dots.push("neutral");

            return dots.slice(0, 13).map((type, i) => {
              const modifier = type !== "neutral" ? ` game-circle--${type}` : "";
              const showNumber = type === "current" || type === "neutral";
              const icon = type === "won" ? "✔" : type === "lost" ? "✖" : type === "pass" ? "!" : null;
              return <div key={i} className={`game-circle${modifier}`}>{showNumber ? <span className="game-circle__number">{i + 1}</span> : icon && <span className="game-circle__icon">{icon}</span>}</div>;
            });
          })()}
          <span className="game-legend__item"><span className="game-legend__dot game-circle--won" />{t("game.legend.won")}</span>
          <span className="game-legend__item"><span className="game-legend__dot game-circle--lost" />{t("game.legend.lost")}</span>
          <span className="game-legend__item"><span className="game-legend__dot game-circle--pass" />{t("game.legend.passed")}</span>
        </div>

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
                {isGuesser && (
                  <span className={`game-player__badge${gameState.phase === "guess" ? " game-player__badge--thinking" : ""}`} style={{ background: "rgba(213, 147, 255, 0.15)", color: "var(--color-purple)" }}>
                    {t("game.role.guesser")}
                  </span>
                )}
                {!isGuesser && gameState.phase === "filter" && (
                  isFilterPlayer ? (
                    <span className="game-player__badge game-player__badge--thinking" style={{ animationDelay: `${player.id * 0.4}s`, background: "rgba(255, 214, 0, 0.15)", color: "#ffd600" }}>
                      {t("game.badge.working")}
                    </span>
                  ) : (
                    <span className="game-player__badge">
                      {t("game.badge.ready")}
                    </span>
                  )
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
                {!isGuesser && gameState.phase === "guess" && (
                  <span className="game-player__badge">
                    {t("game.badge.ready")}
                  </span>
                )}
                {!isGuesser && gameState.phase === "validate" && (
                  isFilterPlayer ? (
                    <span className="game-player__badge game-player__badge--thinking" style={{ animationDelay: `${player.id * 0.4}s`, background: "rgba(255, 214, 0, 0.15)", color: "#ffd600" }}>
                      {t("game.badge.working")}
                    </span>
                  ) : (
                    <span className="game-player__badge">
                      {t("game.badge.ready")}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      <RoundResultOverlay gameState={gameState} />
    </div>
  );
}
