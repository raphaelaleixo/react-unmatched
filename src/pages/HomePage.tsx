import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";
import AppHeader from "../components/AppHeader";
import UnmatchedLogo from "../components/UnmatchedLogo";

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language;

  async function handleNewGame() {
    const room = createInitialRoom({
      minPlayers: 3,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), currentLang);
    navigate(`/room/${room.roomId}`);
  }

  return (
    <div className="home">
      <AppHeader />

      <main className="home__main">
        <section className="home__hero">
          <div className="home__badge">
            <span className="home__badge-dot" />
            <span className="home__badge-text">{t("home.badge")}</span>
          </div>

          <h1 className="home__title">
            <UnmatchedLogo className="unmatched-logo--hero" />
          </h1>

          <p className="home__subtitle">{t("home.subtitle")}</p>

          <div className="home__actions">
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
        </section>
      </main>
    </div>
  );
}
