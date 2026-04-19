import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinGamePage from "./pages/JoinGamePage";
import LobbyPage from "./pages/LobbyPage";
import PlayerJoinPage from "./pages/PlayerJoinPage";
import PlayerPage from "./pages/PlayerPage";
import RejoinPage from "./pages/RejoinPage";
import RulesPage from "./pages/RulesPage";
import PageTransition from "./components/PageTransition";

export default function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
      <Route path="/join" element={<PageTransition><JoinGamePage /></PageTransition>} />
      <Route path="/rules" element={<PageTransition><RulesPage /></PageTransition>} />
      <Route path="/room/:roomId" element={<PageTransition><LobbyPage /></PageTransition>} />
      <Route path="/room/:roomId/player" element={<PageTransition><PlayerJoinPage /></PageTransition>} />
      <Route path="/room/:roomId/player/:playerId" element={<PageTransition><PlayerPage /></PageTransition>} />
      <Route path="/room/:roomId/players" element={<PageTransition><RejoinPage /></PageTransition>} />
    </Routes>
  );
}
