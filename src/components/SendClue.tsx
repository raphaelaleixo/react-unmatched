import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

interface SendClueProps {
  roomId: string;
  playerId: number;
  word: string;
  submitted: boolean;
}

export default function SendClue({
  roomId,
  playerId,
  word,
  submitted,
}: SendClueProps) {
  const { t } = useTranslation();
  const [clue, setClue] = useState("");

  async function handleSubmit() {
    const trimmed = clue.trim();
    if (!trimmed) return;
    await set(ref(db, `rooms/${roomId}/game/clues/${playerId}`), trimmed);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="text-muted">{t("game.waitingForClues")}</p>
        <div className="progress-bar" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-heading">{word}</h2>

      <input
        className="input"
        placeholder={t("game.enterClue")}
        value={clue}
        onChange={(e) => setClue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        maxLength={30}
      />
      <br />
      <br />
      <button
        className="btn"
        onClick={handleSubmit}
        disabled={!clue.trim()}
      >
        {t("game.sendClue")}
      </button>
    </div>
  );
}
