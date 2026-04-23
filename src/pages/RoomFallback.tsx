import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import AppHeader from "../components/AppHeader";

export default function RoomFallback() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading } = useFirebaseRoom(roomId);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (loading || !roomState) return;
    const target = roomState.status === "started" ? "players" : "player";
    navigate(`/room/${roomId}/${target}`, { replace: true });
  }, [loading, roomState, roomId, navigate]);

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

  return <div className="page"><p>Loading...</p></div>;
}
