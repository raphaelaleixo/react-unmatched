import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import {
  PlayerSlotsGrid,
  RoomQRCode,
  RoomInfoModal,
  useRoomState,
  joinPlayer,
  startGame,
  buildPlayerUrl,
} from "react-gameroom";
import { db } from "../firebase";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { pickWords } from "../helpers/gameHelpers";
import BigScreenGame from "../components/BigScreenGame";

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const { t } = useTranslation();

  const [nickname, setNickname] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 4, maxPlayers: 8, requireFull: false },
    },
  );

  const gameState = useGameState(roomId, derived.readyCount);

  const hostJoined = roomState?.players[0]?.status === "ready";

  if (loading || !roomState) {
    return <div className="page"><p>{t("lobby.waitingForPlayers")}</p></div>;
  }

  if (roomState.status === "started") {
    return (
      <BigScreenGame
        roomId={roomId!}
        gameState={gameState}
        playerNames={derived.playerNames}
        playerCount={derived.readyCount}
      />
    );
  }

  async function handleHostJoin() {
    if (!nickname.trim() || !roomState) return;
    await updateRoom(joinPlayer(roomState, 1, nickname.trim()));
  }

  async function handleStartGame() {
    if (!roomState) return;
    const lang = (gameState.lang || "en") as "en" | "pt_br";
    const words = pickWords(lang, 13);
    const playerCount = derived.readyCount;
    const firstAnswering = Math.floor(Math.random() * playerCount) + 1;

    // Write game data first, then flip room status — so players never
    // see status "started" before the game state exists in Firebase.
    await set(ref(db, `rooms/${roomId}/game`), {
      words,
      round: 0,
      answering: firstAnswering,
      phase: "clue",
      points: 0,
      lostPoints: 0,
      message: null,
      lang,
    });
    await updateRoom(startGame(roomState));
  }

  return (
    <div className="page">
      <div className="room-badge">{roomState.roomId}</div>

      <div className="qr-wrapper">
        <RoomQRCode roomId={roomState.roomId} size={160} />
      </div>

      <p>
        {t("lobby.playersReady", {
          count: derived.readyCount,
          max: roomState.config.maxPlayers,
        })}
      </p>

      <PlayerSlotsGrid
        players={roomState.players}
        buildSlotHref={(id) => buildPlayerUrl(roomState.roomId, id)}
      />

      {!hostJoined && (
        <>
          <input
            className="input"
            placeholder={t("lobby.enterNickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHostJoin()}
          />
          <button
            className="btn"
            onClick={handleHostJoin}
            disabled={!nickname.trim()}
          >
            {t("lobby.join")}
          </button>
        </>
      )}

      {hostJoined && (
        <button
          className="btn btn--yellow"
          onClick={handleStartGame}
          disabled={!derived.canStart}
        >
          {t("lobby.startGame")}
        </button>
      )}

      <button className="btn btn--outline" onClick={() => setShowInfo(true)}>
        i
      </button>

      <RoomInfoModal
        roomState={roomState}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
