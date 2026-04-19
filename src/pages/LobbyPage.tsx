import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import {
  PlayerSlotsGrid,
  RoomQRCode,
  StartGameButton,
  useRoomState,
  buildJoinUrl,
} from "react-gameroom";
import { db } from "../firebase";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { pickWords } from "../helpers/gameHelpers";
import BigScreenGame from "../components/BigScreenGame";
import AppHeader from "../components/AppHeader";

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const { t } = useTranslation();

  const derived = useRoomState(
    roomState ?? {
      roomId: "",
      status: "lobby",
      players: [],
      config: { minPlayers: 3, maxPlayers: 8, requireFull: false },
    },
  );

  const gameState = useGameState(roomId, derived.playerCount);

  if (loading || !roomState) {
    return <div className="page"><p>{t("lobby.waitingForPlayers")}</p></div>;
  }

  if (roomState.status === "started") {
    return (
      <BigScreenGame
        roomId={roomId!}
        roomState={roomState}
        gameState={gameState}
        playerNames={derived.playerNames}
        playerCount={derived.playerCount}
      />
    );
  }

  return (
    <div className="lobby">
      <AppHeader />

      <div className="lobby__grid">
        <div className="lobby__room-code">
          <h1 className="lobby__room-code-text">{roomState.roomId}</h1>
          <div className="qr-wrapper">
            <RoomQRCode roomId={roomState.roomId} url={buildJoinUrl(roomState.roomId)} size={200} />
          </div>
          <p className="lobby__qr-hint">{t("lobby.scanHint")}</p>
        </div>

        <div className="lobby__players">
          <PlayerSlotsGrid
            players={roomState.players}
            className="slots-grid"
            slotClassName="slot"
            labels={{ empty: "Waiting..." }}
          />
        </div>

        <div className="lobby__actions">
          <p className="lobby__player-count">
            {t("lobby.playersReady", {
              count: derived.readyCount,
              max: roomState.config.maxPlayers,
              min: roomState.config.minPlayers,
            })}
          </p>
          <StartGameButton
            roomState={roomState}
            className="btn"
            labels={{ start: t("lobby.startGame") }}
            onStart={async (newState) => {
              const lang = (gameState.lang || "en") as "en" | "pt_br";
              const words = pickWords(lang, 13);
              const firstAnswering = Math.floor(Math.random() * derived.playerCount) + 1;
              // Write game data first, then flip room status — so players never
              // see status "started" before the game state exists in Firebase.
              await set(ref(db, `rooms/${roomId}/game`), {
                words,
                round: 0,
                answering: firstAnswering,
                phase: "clue",
                message: null,
                lang,
              });
              await updateRoom(newState);
            }}
          />
        </div>
      </div>

    </div>
  );
}
