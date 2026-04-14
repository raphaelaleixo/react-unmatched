import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set, onValue } from "firebase/database";
import { PlayerScreen, joinPlayer } from "react-gameroom";
import { db } from "../firebase";
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
  const gameState = useGameState(roomId);
  const { t, i18n } = useTranslation();

  const [nickname, setNickname] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    if (gameState.lang) {
      i18n.changeLanguage(gameState.lang);
    }
  }, [gameState.lang, i18n]);

  useEffect(() => {
    if (!roomId) return;
    const nameRef = ref(db, `rooms/${roomId}/playerNames/${playerId}`);
    const unsub = onValue(nameRef, (snap) => {
      if (snap.val()) setSavedName(snap.val());
    });
    return unsub;
  }, [roomId, playerId]);

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
  }

  async function handleNameSave() {
    if (!nickname.trim() || !roomState) return;
    await set(
      ref(db, `rooms/${roomId}/playerNames/${playerId}`),
      nickname.trim(),
    );
    await updateRoom(joinPlayer(roomState, playerId));
    setSavedName(nickname.trim());
  }

  function renderGamePhase() {
    const isAnswering = gameState.answering === playerId;
    const filterPlayer = getFilterPlayer(
      gameState.answering,
      gameState.playerCount,
    );
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
              playerNames={gameState.playerNames}
              answering={gameState.answering}
              playerCount={gameState.playerCount}
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
                name: gameState.playerNames[filterPlayer] || `Player ${filterPlayer}`,
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
              answering={gameState.answering}
              playerCount={gameState.playerCount}
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
                name: gameState.playerNames[gameState.answering] || `Player ${gameState.answering}`,
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
              answering={gameState.answering}
              playerCount={gameState.playerCount}
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
                name: gameState.playerNames[filterPlayer] || `Player ${filterPlayer}`,
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
          <p>
            {savedName || nickname}
          </p>
          <p className="text-muted">{t("lobby.waitingForPlayers")}</p>
          <div className="progress-bar" />
        </div>
      )}
      renderStarted={() => renderGamePhase()}
    />
  );
}
