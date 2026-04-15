import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { PlayerScreen, useRoomState } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { getFilterPlayer, isGameOver } from "../helpers/gameHelpers";
import AppHeader from "../components/AppHeader";
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

  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 4, maxPlayers: 8, requireFull: false },
    },
  );

  const gameState = useGameState(roomId, derived.playerCount);
  const { playerNames } = derived;
  const playerCount = derived.playerCount;

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
  }

  function renderGamePhase() {
    const isAnswering = gameState.answering === playerId;
    const filterPlayer = getFilterPlayer(gameState.answering, playerCount);
    const isFilter = filterPlayer === playerId;
    const finished = isGameOver(
      gameState.points,
      gameState.lostPoints,
      gameState.round,
    );

    if (finished) {
      return <FinishGame gameState={gameState} roomId={roomId!} />;
    }

    switch (gameState.phase) {
      case "clue":
        if (isAnswering) {
          return (
            <div className="text-center">
              <h2>{t("game.yourTurnToGuess")}</h2>
              <p className="text-muted">{t("game.waitingForClues")}</p>
              <div className="progress-bar" />
            </div>
          );
        }
        return (
          <SendClue
            roomId={roomId!}
            playerId={playerId}
            word={gameState.words[gameState.round]}
            submitted={playerId in gameState.clues}
            cluesCount={Object.keys(gameState.clues).length}
            totalHinters={playerCount - 1}
          />
        );

      case "filter":
        if (isFilter) {
          return (
            <FilterClues
              roomId={roomId!}
              clues={gameState.clues}
              playerNames={playerNames}
              playerCount={playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
              word={gameState.words[gameState.round]}
            />
          );
        }
        return (
          <div className="waiting-screen">
            <div className="waiting-screen__group">
              <h2>{t("game.waiting.title")}</h2>
              <p className="text-muted">
                <Trans
                  i18nKey="game.waiting.filterBody"
                  values={{ name: playerNames[filterPlayer] || `Player ${filterPlayer}` }}
                  components={{ bold: <strong className="waiting-screen__name" /> }}
                />
              </p>
            </div>
            <div className="progress-bar" />
          </div>
        );

      case "guess":
        if (isAnswering) {
          return (
            <MakeGuess
              roomId={roomId!}
              validClues={gameState.validClues}
              invalidCount={gameState.invalidClues.length}
              playerCount={playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="waiting-screen">
            <div className="waiting-screen__group">
              <h2>{t("game.waiting.title")}</h2>
              <p className="text-muted">
                <Trans
                  i18nKey="game.waiting.guessBody"
                  values={{ name: playerNames[gameState.answering] || `Player ${gameState.answering}` }}
                  components={{ bold: <strong className="waiting-screen__name" /> }}
                />
              </p>
            </div>
            <div className="progress-bar" />
          </div>
        );

      case "validate": {
        if (isFilter) {
          return (
            <ValidateAnswer
              roomId={roomId!}
              guess={gameState.guess!}
              word={gameState.words[gameState.round]}
              guesserName={playerNames[gameState.answering] || `Player ${gameState.answering}`}
              playerCount={playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="waiting-screen">
            <div className="waiting-screen__group">
              <h2>{t("game.waiting.title")}</h2>
              <p className="text-muted">
                <Trans
                  i18nKey="game.waiting.validateBody"
                  values={{ name: playerNames[filterPlayer] || `Player ${filterPlayer}` }}
                  components={{ bold: <strong className="waiting-screen__name" /> }}
                />
              </p>
            </div>
            <div className="progress-bar" />
          </div>
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
      renderReady={() => (
        <div className="text-center">
          <p className="room-badge">{roomState.roomId}</p>
          <p>{playerName}</p>
          <p className="text-muted">{t("lobby.waitingForPlayers")}</p>
          <div className="progress-bar" />
        </div>
      )}
      renderStarted={() => (
        <>
          <AppHeader roomCode={roomId} roomState={roomState} playerNumber={playerId} />
          {renderGamePhase()}
        </>
      )}
    />
  );
}
