import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RoomInfoModal } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import UnmatchedLogo from "./UnmatchedLogo";

interface AppHeaderProps {
  roomCode?: string;
  roomState?: RoomState;
}

export default function AppHeader({ roomCode, roomState }: AppHeaderProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="app-header">
      <UnmatchedLogo className="unmatched-logo--header" />
      <div className="app-header__right">
        {roomCode && (
          <button
            className="app-header__room-code"
            onClick={() => setShowInfo(true)}
          >
            {roomCode}
          </button>
        )}
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
