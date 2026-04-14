import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { joinPlayer, findFirstEmptySlot } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";

export default function PlayerJoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading, updateRoom } = useFirebaseRoom(roomId);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
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
      <p className="room-badge">{roomState.roomId}</p>
      <input
        className="input"
        placeholder={t("lobby.enterNickname")}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />
      {error && <p className="text-error">{error}</p>}
      <button
        className="btn"
        onClick={handleJoin}
        disabled={!nickname.trim()}
      >
        {t("lobby.join")}
      </button>
    </div>
  );
}
