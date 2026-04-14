import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinGamePage from "./pages/JoinGamePage";
import LobbyPage from "./pages/LobbyPage";
import PlayerJoinPage from "./pages/PlayerJoinPage";
import PlayerPage from "./pages/PlayerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinGamePage />} />
      <Route path="/room/:roomId" element={<LobbyPage />} />
      <Route path="/room/:roomId/player" element={<PlayerJoinPage />} />
      <Route path="/room/:roomId/player/:playerId" element={<PlayerPage />} />
    </Routes>
  );
}
