/**
 * PlayerPage — the main phone-screen view for an individual player.
 *
 * This page is the hub for all player interactions during the game.
 * It renders different UI depending on:
 *   - The current game phase (clue / filter / guess / validate)
 *   - The player's role this round (guesser / filter player / hinter)
 *   - The overall game status (lobby / started / finished)
 *
 * Players who aren't the active actor in a phase see a WaitingScreen
 * with a message about who they're waiting for.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PlayerScreen, useRoomState } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import {
  getFilterPlayer,
  isGameOver,
  getCluesPerHinter,
  hasPlayerSubmittedAllClues,
  countReadyHinters,
  makeClueKey,
} from "../helpers/gameHelpers";
import AppHeader from "../components/AppHeader";
import RoundResultOverlay from "../components/RoundResultOverlay";
import WaitingScreen from "../components/WaitingScreen";
import SendClue from "../components/SendClue";
import FilterClues from "../components/FilterClues";
import MakeGuess from "../components/MakeGuess";
import ValidateAnswer from "../components/ValidateAnswer";
import FinishGame from "../components/FinishGame";

export default function PlayerPage() {
  const { roomId, playerId: playerIdStr } = useParams<{
    roomId: string;
    playerId: string;
  }>();
  const playerId = Number(playerIdStr);
  const { roomState, loading } = useFirebaseRoom(roomId);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Derive player list metadata from react-gameroom
  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
    },
  );

  const gameState = useGameState(roomId, derived.playerCount);
  const { playerNames } = derived;
  const playerCount = derived.playerCount;

  // Hide the game UI while the round-result overlay is showing
  const [overlayVisible, setOverlayVisible] = useState(false);
  const handleOverlayVisibility = useCallback((visible: boolean) => setOverlayVisible(visible), []);

  // Sync the app language to whatever the lobby host selected
  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  if (loading) {
    return <div className="page"><p>Loading...</p></div>;
  }

  if (!roomState) {
    return (
      <div className="page">
        <AppHeader />
        <div className="player-join">
          <h2 className="player-join__title text-center">{t("lobby.roomNotFound")}</h2>
          <p className="text-muted text-center">{t("lobby.roomNotFoundSubtitle")}</p>
          <button className="btn" onClick={() => navigate("/")}>
            {t("lobby.backHome")}
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render the correct component for the current phase and player role.
   *
   * Role priority: guesser > filter player > hinter (everyone else).
   * Each phase has exactly one "active" role and all others wait.
   */
  function renderGamePhase() {
    const isAnswering = gameState.answering === playerId;
    const filterPlayer = getFilterPlayer(gameState.answering, playerCount);
    const isFilter = filterPlayer === playerId;
    const finished = isGameOver(gameState.round);
    const cluesPerHinter = getCluesPerHinter(playerCount);

    if (finished) {
      return <FinishGame gameState={gameState} />;
    }

    // Helper to get a display name for a player ID
    const nameOf = (id: number) => playerNames[id] || `Player ${id}`;

    switch (gameState.phase) {
      // --- CLUE PHASE ---
      // Guesser waits; hinters write clues; once all submitted, they wait for filter
      case "clue":
        if (isAnswering) {
          return (
            <WaitingScreen
              title={t("game.yourTurnToGuess")}
              message={t("game.waitingForClues")}
            />
          );
        }
        {
          const playerFullySubmitted = hasPlayerSubmittedAllClues(
            gameState.clues, playerId, cluesPerHinter,
          );
          if (playerFullySubmitted) {
            const readyHinters = countReadyHinters(gameState.clues, playerCount);
            const allSubmitted = readyHinters >= playerCount - 1;
            return (
              <WaitingScreen
                title={t("game.waiting.title")}
                message={
                  allSubmitted ? (
                    <Trans
                      i18nKey="game.waiting.filterBody"
                      values={{ name: nameOf(filterPlayer) }}
                      components={{ bold: <strong className="waiting-screen__name" /> }}
                    />
                  ) : (
                    t("game.waiting.pendingClues")
                  )
                }
              />
            );
          }
          // Player hasn't submitted all clues yet — show the clue input form
          let submittedClueCount = 0;
          for (let i = 0; i < cluesPerHinter; i++) {
            if (makeClueKey(playerId, i) in gameState.clues) submittedClueCount++;
          }
          const readyHinters = countReadyHinters(gameState.clues, playerCount);
          return (
            <SendClue
              roomId={roomId!}
              playerId={playerId}
              word={gameState.words[gameState.round]}
              submittedClueCount={submittedClueCount}
              cluesPerHinter={cluesPerHinter}
              readyHinters={readyHinters}
              totalHinters={playerCount - 1}
            />
          );
        }

      // --- FILTER PHASE ---
      // Filter player reviews clues; everyone else waits
      case "filter":
        if (isFilter) {
          return (
            <FilterClues
              roomId={roomId!}
              clues={gameState.clues}
              playerNames={playerNames}
              playerCount={playerCount}
              round={gameState.round}
              word={gameState.words[gameState.round]}
            />
          );
        }
        return (
          <WaitingScreen
            title={t("game.waiting.title")}
            message={
              <Trans
                i18nKey="game.waiting.filterBody"
                values={{ name: nameOf(filterPlayer) }}
                components={{ bold: <strong className="waiting-screen__name" /> }}
              />
            }
          />
        );

      // --- GUESS PHASE ---
      // Guesser types their answer; everyone else waits
      case "guess":
        if (isAnswering) {
          return (
            <MakeGuess
              roomId={roomId!}
              validClues={gameState.validClues}
              invalidCount={gameState.invalidClues.length}
              playerCount={playerCount}
              round={gameState.round}
            />
          );
        }
        return (
          <WaitingScreen
            title={t("game.waiting.title")}
            message={
              <Trans
                i18nKey="game.waiting.guessBody"
                values={{ name: nameOf(gameState.answering) }}
                components={{ bold: <strong className="waiting-screen__name" /> }}
              />
            }
          />
        );

      // --- VALIDATE PHASE ---
      // Filter player judges the guess; everyone else waits
      case "validate": {
        if (isFilter) {
          return (
            <ValidateAnswer
              roomId={roomId!}
              guess={gameState.guess!}
              word={gameState.words[gameState.round]}
              guesserName={nameOf(gameState.answering)}
              clues={gameState.clues}
              playerCount={playerCount}
              round={gameState.round}
            />
          );
        }
        return (
          <WaitingScreen
            title={t("game.waiting.title")}
            message={
              <Trans
                i18nKey="game.waiting.validateBody"
                values={{ name: nameOf(filterPlayer) }}
                components={{ bold: <strong className="waiting-screen__name" /> }}
              />
            }
          />
        );
      }

      default:
        return null;
    }
  }

  const playerName = roomState.players.find((p) => p.id === playerId)?.name;

  return (
    <PlayerScreen
      roomState={roomState}
      playerId={playerId}
      className="page"
      renderEmpty={() => (
        <div className="text-center">
          <p className="text-muted">Loading...</p>
          <div className="progress-bar" />
        </div>
      )}
      renderHeader={() => (
        <AppHeader roomCode={roomId} roomState={roomState} playerNumber={playerId} />
      )}
      renderReady={() => (
        <WaitingScreen
          title={playerName ?? ""}
          message={t("lobby.waitingForPlayers")}
        />
      )}
      renderStarted={() => (
        <>
          {/* Hide game UI during overlay animation to avoid visual overlap */}
          {!overlayVisible && renderGamePhase()}
          <RoundResultOverlay gameState={gameState} onVisibilityChange={handleOverlayVisibility} />
        </>
      )}
    />
  );
}
