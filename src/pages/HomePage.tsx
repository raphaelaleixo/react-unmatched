import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language;

  function toggleLang(lang: string) {
    i18n.changeLanguage(lang);
  }

  async function handleNewGame() {
    const room = createInitialRoom({
      minPlayers: 4,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), currentLang);
    navigate(`/room/${room.roomId}`);
  }

  return (
    <div className="page">
      <h1>{t("home.title")}</h1>

      <div className="lang-toggle">
        <button
          className={currentLang === "en" ? "active" : ""}
          onClick={() => toggleLang("en")}
        >
          EN
        </button>
        <button
          className={currentLang === "pt_br" ? "active" : ""}
          onClick={() => toggleLang("pt_br")}
        >
          PT
        </button>
      </div>

      <button className="btn" onClick={handleNewGame}>
        {t("home.newGame")}
      </button>

      <button
        className="btn btn--outline"
        onClick={() => navigate("/join")}
      >
        {t("home.joinGame")}
      </button>
    </div>
  );
}
