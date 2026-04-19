import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { joinPlayer, findFirstEmptySlot } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import AppHeader from "../components/AppHeader";

export default function PlayerJoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  if (roomState.status === "started") {
    return (
      <div className="page">
        <AppHeader roomCode={roomId} roomState={roomState} hideLangToggle />
        <div className="player-join">
          <h2 className="player-join__title">{t("join.alreadyStartedTitle")}</h2>
          <p className="text-muted">{t("join.alreadyStartedSubtitle")}</p>
        </div>
      </div>
    );
  }

  async function handleJoin() {
    if (!nickname.trim() || !roomState) return;
    setError(null);

    const slot = findFirstEmptySlot(roomState.players);
    if (!slot) {
      setError(t("join.roomFull"));
      return;
    }

    await updateRoom(joinPlayer(roomState, slot.id, nickname.trim()));
    navigate(`/room/${roomId}/player/${slot.id}`, { replace: true });
  }

  return (
    <div className="page">
      <AppHeader roomCode={roomId} roomState={roomState} />
      <div className="player-join">
        <h2 className="player-join__title">{t("lobby.welcome")}</h2>
        <div className="input-group">
          <label className="input-label" htmlFor="nickname">{t("lobby.nicknameLabel")}</label>
          <input
            id="nickname"
            className="input"
            placeholder={t("lobby.enterNickname")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
        </div>
        {error && <p className="text-error">{error}</p>}
        <button
          className="btn"
          onClick={handleJoin}
          disabled={!nickname.trim()}
        >
          {t("lobby.join")}
        </button>
      </div>
    </div>
  );
}
