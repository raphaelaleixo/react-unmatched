import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import { createInitialRoom } from "react-gameroom";
import type { GameState } from "../hooks/useGameState";
import ScoreTracker from "./ScoreTracker";

interface FinishGameProps {
  gameState: GameState;
  roomId: string;
}

export default function FinishGame({ gameState, roomId }: FinishGameProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    remove(ref(db, `rooms/${roomId}/game`));
  }, [roomId]);

  async function handlePlayAgain() {
    const room = createInitialRoom({
      minPlayers: 4,
      maxPlayers: 8,
      requireFull: false,
    });
    await set(ref(db, `rooms/${room.roomId}/state`), room);
    await set(ref(db, `rooms/${room.roomId}/game/lang`), gameState.lang);
    navigate(`/room/${room.roomId}`);
  }

  return (
    <div className="text-center">
      <h1>{t("finish.gameOver")}</h1>

      <ScoreTracker points={gameState.points} lostPoints={gameState.lostPoints} results={gameState.results} />

      <p className="text-large text-heading">
        {t("finish.score", { points: gameState.points })}
      </p>

      <button className="btn" onClick={handlePlayAgain}>
        {t("finish.playAgain")}
      </button>

      <button className="btn btn--outline" onClick={() => navigate("/join")}>
        {t("finish.joinAnother")}
      </button>
    </div>
  );
}
