import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlayerScreen, joinPlayer, useRoomState } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { getFilterPlayer, isGameOver } from "../helpers/gameHelpers";
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
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const { t, i18n } = useTranslation();

  const [nickname, setNickname] = useState("");

  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 4, maxPlayers: 8, requireFull: false },
    },
  );

  const gameState = useGameState(roomId, derived.readyCount);
  const { playerNames } = derived;
  const playerCount = derived.readyCount;

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
  }

  async function handleNameSave() {
    if (!nickname.trim() || !roomState) return;
    await updateRoom(joinPlayer(roomState, playerId, nickname.trim()));
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
            />
          );
        }
        return (
          <div className="text-center">
            <p className="text-muted">
              {t("game.validateClues", {
                name: playerNames[filterPlayer] || `Player ${filterPlayer}`,
              })}
            </p>
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
          <div className="text-center">
            <p className="text-muted">
              {t("game.waitingForName", {
                name: playerNames[gameState.answering] || `Player ${gameState.answering}`,
              })}
            </p>
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
              playerCount={playerCount}
              round={gameState.round}
              points={gameState.points}
              lostPoints={gameState.lostPoints}
            />
          );
        }
        return (
          <div className="text-center">
            <p className="text-muted">
              {t("game.validatingName", {
                name: playerNames[filterPlayer] || `Player ${filterPlayer}`,
              })}
            </p>
            <div className="progress-bar" />
          </div>
        );
      }

      default:
        return null;
    }
  }

  const savedName = roomState.players.find((p) => p.id === playerId)?.name;

  return (
    <PlayerScreen
      roomState={roomState}
      playerId={playerId}
      className="page"
      renderEmpty={() => (
        <div className="text-center">
          <p className="room-badge">{roomState.roomId}</p>
          <p className="text-muted">Player {playerId}</p>
          <input
            className="input"
            placeholder={t("lobby.enterNickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
          />
          <br />
          <br />
          <button
            className="btn"
            onClick={handleNameSave}
            disabled={!nickname.trim()}
          >
            {t("lobby.join")}
          </button>
        </div>
      )}
      renderReady={() => (
        <div className="text-center">
          <p className="room-badge">{roomState.roomId}</p>
          <p>{savedName || nickname}</p>
          <p className="text-muted">{t("lobby.waitingForPlayers")}</p>
          <div className="progress-bar" />
        </div>
      )}
      renderStarted={() => renderGamePhase()}
    />
  );
}
