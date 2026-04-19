import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlayerSlotsGrid, buildPlayerUrl } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import AppHeader from "../components/AppHeader";

export default function RejoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading } = useFirebaseRoom(roomId);
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  return (
    <div className="page">
      <AppHeader roomCode={roomId} roomState={roomState} hideLangToggle />
      <div className="rejoin">
        <div className="rejoin__group">
          <div className="rejoin__header">
            <h2 className="rejoin__title">{t("lobby.rejoinTitle")}</h2>
            <p className="rejoin__instruction">{t("lobby.tapToRejoin")}</p>
          </div>
        </div>

        <div className="rejoin__group">
          <PlayerSlotsGrid
            players={roomState.players}
            filterEmpty
            buildSlotHref={(id) => buildPlayerUrl(roomState.roomId, id)}
            className="slots-grid"
            slotClassName="slot"
            labels={{ ready: "Rejoin" }}
          />
        </div>
      </div>
    </div>
  );
}
