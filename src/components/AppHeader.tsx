import { useTranslation } from "react-i18next";
import UnmatchedLogo from "./UnmatchedLogo";

export default function AppHeader() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  return (
    <header className="app-header">
      <UnmatchedLogo className="unmatched-logo--header" />
      <div className="lang-toggle">
        <button
          className={currentLang === "en" ? "active" : ""}
          onClick={() => i18n.changeLanguage("en")}
        >
          EN
        </button>
        <button
          className={currentLang === "pt_br" ? "active" : ""}
          onClick={() => i18n.changeLanguage("pt_br")}
        >
          PT
        </button>
      </div>
    </header>
  );
}
