import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ref, set } from "firebase/database";
import { RoomInfoModal } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import { db } from "../firebase";
import UnmatchedLogo from "./UnmatchedLogo";

interface AppHeaderProps {
  roomCode?: string;
  roomState?: RoomState;
  playerNumber?: number;
  hideLangToggle?: boolean;
}

export default function AppHeader({ roomCode, roomState, playerNumber, hideLangToggle }: AppHeaderProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="app-header">
      <Link to="/" className="app-header__logo-link" aria-label="Home">
        <UnmatchedLogo className="unmatched-logo--header" />
      </Link>
      <div className="app-header__right">
        {roomCode && (
          <button
            className="app-header__room-code"
            onClick={() => setShowInfo(true)}
          >
            {roomCode}
          </button>
        )}
        {playerNumber != null ? (
          <span className="app-header__player-number">{playerNumber}</span>
        ) : hideLangToggle ? null : (
          <div className="lang-toggle">
            <button
              className={currentLang === "en" ? "active" : ""}
              onClick={() => {
                i18n.changeLanguage("en");
                if (roomCode) set(ref(db, `rooms/${roomCode}/game/lang`), "en");
              }}
            >
              EN
            </button>
            <button
              className={currentLang === "pt_br" ? "active" : ""}
              onClick={() => {
                i18n.changeLanguage("pt_br");
                if (roomCode) set(ref(db, `rooms/${roomCode}/game/lang`), "pt_br");
              }}
            >
              PT
            </button>
          </div>
        )}
      </div>

      {roomState && (
        <RoomInfoModal
          roomState={roomState}
          open={showInfo}
          onClose={() => setShowInfo(false)}
          className="room-info-modal"
          closeButtonClassName="room-info-close"
          linkClassName="room-info-link"
        />
      )}
    </header>
  );
}
