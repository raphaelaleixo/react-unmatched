import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import AppHeader from "../components/AppHeader";
import { parseWordList, findDuplicates } from "../helpers/gameHelpers";

type LoadState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "started" }
  | { kind: "ready" };

const MIN_WORDS = 13;

export default function AddWordsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    (async () => {
      const snap = await get(ref(db, `rooms/${roomId}`));
      if (cancelled) return;
      const value = snap.val() as
        | { state?: { status?: string }; game?: { customWords?: string[] } }
        | null;
      if (!value || !value.state) {
        setLoad({ kind: "not-found" });
        return;
      }
      if (value.state.status === "started") {
        setLoad({ kind: "started" });
        return;
      }
      const existing = value.game?.customWords ?? [];
      setText(existing.join("\n"));
      setLoad({ kind: "ready" });
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const parsed = useMemo(() => parseWordList(text), [text]);
  const duplicates = useMemo(() => findDuplicates(parsed), [parsed]);
  const canSubmit =
    !submitting &&
    duplicates.length === 0 &&
    parsed.length >= MIN_WORDS &&
    submittedCount === null;

  async function handleSubmit() {
    if (!roomId || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await set(ref(db, `rooms/${roomId}/game/customWords`), parsed);
      setSubmittedCount(parsed.length);
    } catch {
      setSubmitError(t("addWords.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (load.kind === "loading") {
    return (
      <div className="page">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (load.kind === "not-found") {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="player-join">
          <h2 className="player-join__title text-center">{t("join.roomNotFound")}</h2>
          <button className="btn" onClick={() => navigate("/")}>{t("addWords.backHome")}</button>
        </div>
      </div>
    );
  }

  if (load.kind === "started") {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="player-join">
          <h2 className="player-join__title text-center">{t("addWords.alreadyStartedTitle")}</h2>
          <p className="text-muted text-center">{t("addWords.alreadyStartedBody")}</p>
          <button className="btn" onClick={() => navigate("/")}>{t("addWords.backHome")}</button>
        </div>
      </div>
    );
  }

  if (submittedCount !== null) {
    return (
      <div className="page add-words-page">
        <AppHeader />
        <div className="add-words-page__success">
          <h2>{t("addWords.successTitle")}</h2>
          <p>{t("addWords.successBody", { count: submittedCount })}</p>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setSubmittedCount(null)}
          >
            {t("addWords.editAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page add-words-page">
      <AppHeader />
      <div className="add-words-page__content">
        <header>
          <h2>{t("addWords.title")}</h2>
          <p className="text-muted">{t("addWords.subtitleRoom", { code: roomId })}</p>
        </header>
        <p>{t("addWords.instructions")}</p>
        <label htmlFor="add-words-textarea" className="input-label">
          {t("addWords.textareaLabel")}
        </label>
        <textarea
          id="add-words-textarea"
          className="input add-words-page__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("addWords.textareaPlaceholder")}
          rows={12}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <p
          className={
            parsed.length >= MIN_WORDS
              ? "add-words-page__counter add-words-page__counter--ok"
              : "add-words-page__counter"
          }
        >
          {t("addWords.counter", { count: parsed.length })}
        </p>
        {duplicates.length > 0 && (
          <p className="add-words-page__warning">
            {t("addWords.duplicatesWarning", { words: duplicates.join(", ") })}
          </p>
        )}
        {parsed.length > 0 && parsed.length < MIN_WORDS && duplicates.length === 0 && (
          <p className="add-words-page__warning">
            {t("addWords.tooFewWarning", { count: parsed.length })}
          </p>
        )}
        {submitError && <p className="text-error">{submitError}</p>}
        <button
          type="button"
          className="btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? t("addWords.submitting") : t("addWords.submit")}
        </button>
      </div>
    </div>
  );
}
