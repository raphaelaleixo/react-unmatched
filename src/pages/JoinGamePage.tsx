import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { JoinGame } from "react-gameroom";
import { roomExists } from "../hooks/useFirebaseRoom";
import AppHeader from "../components/AppHeader";

export default function JoinGamePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(roomCode: string) {
    setError(null);

    const exists = await roomExists(roomCode);
    if (!exists) {
      setError(t("join.roomNotFound"));
      return;
    }

    navigate(`/room/${roomCode}/player`);
  }

  return (
    <div className="page">
      <AppHeader />
      <h2>{t("home.joinGame")}</h2>

      <JoinGame
        onJoin={handleJoin}
        inputClassName="input"
        buttonClassName="btn"
        renderError={error ? () => <p className="text-error">{error}</p> : undefined}
      />

      <button
        className="btn btn--outline"
        onClick={() => navigate("/")}
      >
        {t("join.back")}
      </button>
    </div>
  );
}
