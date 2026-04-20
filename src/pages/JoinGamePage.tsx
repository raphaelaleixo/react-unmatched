import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HostDeviceWarningModal, isLikelyMobileHost } from "react-gameroom";
import { getRoomStatus } from "../hooks/useFirebaseRoom";
import AppHeader from "../components/AppHeader";

type SubmittingRole = "host" | "player" | null;

export default function JoinGamePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmittingRole>(null);
  const [pendingHostCode, setPendingHostCode] = useState<string | null>(null);

  const trimmed = code.trim();
  const disabled = submitting !== null || trimmed.length === 0;

  async function resolveStatus(role: SubmittingRole) {
    setError(null);
    setSubmitting(role);
    const status = await getRoomStatus(trimmed);
    setSubmitting(null);
    if (status === null) {
      setError(t("join.roomNotFound"));
      return null;
    }
    return status;
  }

  async function handleResumeAsHost(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    const status = await resolveStatus("host");
    if (status === null) return;
    if (isLikelyMobileHost()) {
      setPendingHostCode(trimmed);
      return;
    }
    navigate(`/room/${trimmed}`);
  }

  async function handleResumeAsPlayer() {
    if (!trimmed) return;
    const status = await resolveStatus("player");
    if (status === null) return;
    navigate(
      status === "started"
        ? `/room/${trimmed}/players`
        : `/room/${trimmed}/player`,
    );
  }

  return (
    <div className="page join-page">
      <AppHeader />

      <div className="join-page__content">
        <header className="join-page__header">
          <h2 className="join-page__title">{t("join.title")}</h2>
          <p className="join-page__subtitle">{t("join.subtitle")}</p>
        </header>

        <form className="join-page__form" onSubmit={handleResumeAsHost}>
          <label
            htmlFor="join-room-code"
            className="input-label join-page__label"
          >
            {t("join.codeLabel")}
          </label>
          <input
            id="join-room-code"
            type="text"
            className="input join-page__input"
            placeholder={t("join.codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
          />

          <button
            type="submit"
            className="btn join-page__resume-host"
            disabled={disabled}
          >
            {submitting === "host"
              ? t("join.submitting")
              : t("join.resumeAsHost")}
          </button>
          <button
            type="button"
            className="btn btn--outline join-page__resume-player"
            onClick={handleResumeAsPlayer}
            disabled={disabled}
          >
            {submitting === "player"
              ? t("join.submitting")
              : t("join.resumeAsPlayer")}
          </button>

          {error && <p className="text-error join-page__error">{error}</p>}
        </form>

        <button
          type="button"
          className="btn btn--outline join-page__back"
          onClick={() => navigate("/")}
        >
          {t("join.back")}
        </button>
      </div>

      <HostDeviceWarningModal
        open={pendingHostCode !== null}
        onConfirm={() => {
          const roomCode = pendingHostCode;
          setPendingHostCode(null);
          if (roomCode) navigate(`/room/${roomCode}`);
        }}
        onCancel={() => setPendingHostCode(null)}
        className="host-device-warning-modal"
        confirmButtonClassName="btn"
        cancelButtonClassName="btn btn--outline"
        labels={{
          title: t("hostWarning.title"),
          body: t("hostWarning.body"),
          confirmLabel: t("hostWarning.confirm"),
          cancelLabel: t("hostWarning.cancel"),
        }}
      />
    </div>
  );
}
