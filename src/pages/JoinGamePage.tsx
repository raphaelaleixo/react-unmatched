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
    navigate(`/room/${roomCode}`);
  }

  return (
    <div className="page join-page">
      <AppHeader />

      <div className="join-page__content">
        <header className="join-page__header">
          <h2 className="join-page__title">{t("join.title")}</h2>
          <p className="join-page__subtitle">{t("join.subtitle")}</p>
        </header>

        <JoinGame
          onJoin={handleJoin}
          className="join-page__join"
          formClassName="join-page__form"
          labelClassName="input-label join-page__label"
          inputClassName="input join-page__input"
          buttonClassName="btn join-page__submit"
          labels={{
            label: t("join.codeLabel"),
            placeholder: t("join.codePlaceholder"),
            submit: t("join.submit"),
            submitting: t("join.submitting"),
          }}
          renderError={
            error
              ? () => <p className="text-error join-page__error">{error}</p>
              : undefined
          }
        />

        <button
          type="button"
          className="btn btn--outline join-page__back"
          onClick={() => navigate("/")}
        >
          {t("join.back")}
        </button>
      </div>
    </div>
  );
}
