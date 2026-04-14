import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlayerSlotsGrid, buildPlayerUrl } from "react-gameroom";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";

export default function RejoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { roomState, loading } = useFirebaseRoom(roomId);
  const { t } = useTranslation();

  if (loading || !roomState) {
    return <div className="page"><p>Loading...</p></div>;
  }

  return (
    <div className="page">
      <p className="room-badge">{roomState.roomId}</p>
      <p className="text-muted">{t("lobby.tapToRejoin")}</p>
      <PlayerSlotsGrid
        players={roomState.players}
        filterEmpty
        buildSlotHref={(id) => buildPlayerUrl(roomState.roomId, id)}
        className="slots-grid"
        slotClassName="slot"
        labels={{ ready: "Rejoin" }}
      />
    </div>
  );
}
