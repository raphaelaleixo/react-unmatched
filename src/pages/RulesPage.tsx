import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import AppHeader from "../components/AppHeader";

export default function RulesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const phases = ["hints", "filter", "guess", "validate"] as const;

  return (
    <div className="rules">
      <AppHeader />

      <main className="rules__main">
        <header className="rules__header">
          <h1 className="rules__title">{t("rules.title")}</h1>
          <p className="rules__tagline">{t("rules.tagline")}</p>
        </header>

        <section className="rules__section">
          <h2 className="rules__section-title">{t("rules.setup.title")}</h2>
          <p className="rules__body">
            <Trans
              i18nKey="rules.setup.body"
              components={{ bold: <strong /> }}
            />
          </p>
        </section>

        <section className="rules__section">
          <h2 className="rules__section-title">{t("rules.goal.title")}</h2>
          <p className="rules__body">
            <Trans
              i18nKey="rules.goal.body"
              components={{ bold: <strong /> }}
            />
          </p>
        </section>

        <section className="rules__section">
          <h2 className="rules__section-title">{t("rules.round.title")}</h2>
          <ol className="rules__phases">
            {phases.map((phase, idx) => (
              <li key={phase} className="rules__phase">
                <span className="rules__phase-number">{idx + 1}</span>
                <div className="rules__phase-text">
                  <h3 className="rules__phase-title">
                    {t(`rules.round.${phase}.title`)}
                  </h3>
                  <p className="rules__phase-body">
                    <Trans
                      i18nKey={`rules.round.${phase}.body`}
                      components={{ bold: <strong /> }}
                    />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rules__section">
          <h2 className="rules__section-title">{t("rules.scoring.title")}</h2>
          <ul className="rules__scoring">
            <li className="rules__score-row rules__score-row--right">
              <span className="rules__score-value">+1</span>
              <span className="rules__score-label">{t("rules.scoring.right")}</span>
            </li>
            <li className="rules__score-row rules__score-row--wrong">
              <span className="rules__score-value">−1</span>
              <span className="rules__score-label">{t("rules.scoring.wrong")}</span>
            </li>
            <li className="rules__score-row rules__score-row--pass">
              <span className="rules__score-value">0</span>
              <span className="rules__score-label">{t("rules.scoring.pass")}</span>
            </li>
          </ul>
          <p className="rules__body rules__body--muted">
            {t("rules.scoring.total")}
          </p>
        </section>

        <section className="rules__section">
          <h2 className="rules__section-title">{t("rules.clueRules.title")}</h2>
          <ul className="rules__list">
            <li>{t("rules.clueRules.oneWord")}</li>
            <li>{t("rules.clueRules.duplicates")}</li>
            <li>{t("rules.clueRules.variants")}</li>
            <li>{t("rules.clueRules.fairPlay")}</li>
          </ul>
        </section>

        <div className="rules__actions">
          <button className="btn" onClick={() => navigate("/")}>
            {t("rules.back")}
          </button>
        </div>
      </main>
    </div>
  );
}
