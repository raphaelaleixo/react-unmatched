/**
 * PlayerBadge — renders the status badge next to a player's name on the
 * big-screen game view.
 *
 * Each badge reflects what the player is currently doing:
 *   - Guesser:  always shows "Guesser" (pulses during guess phase)
 *   - Filter player in filter/validate phase: "Working…" with pulse animation
 *   - Hinter in clue phase who already submitted: "Submitted"
 *   - Hinter in clue phase still writing:       "Thinking…" with pulse
 *   - Everyone else:                             "Ready"
 *
 * @param phase          - current game phase
 * @param isGuesser      - whether this player is the guesser this round
 * @param isFilterPlayer - whether this player is the filter player this round
 * @param hasSubmitted   - whether this hinter has submitted all clues (clue phase only)
 * @param playerId       - player id, used to stagger the pulse animation
 */
import { useTranslation } from "react-i18next";

interface PlayerBadgeProps {
  phase: string | null;
  isGuesser: boolean;
  isFilterPlayer: boolean;
  hasSubmitted: boolean;
  playerId: number;
}

export default function PlayerBadge({
  phase,
  isGuesser,
  isFilterPlayer,
  hasSubmitted,
  playerId,
}: PlayerBadgeProps) {
  const { t } = useTranslation();

  // --- Guesser badge (always visible, pulses when it's their turn to guess) ---
  if (isGuesser) {
    return (
      <span
        className={`game-player__badge${phase === "guess" ? " game-player__badge--thinking" : ""}`}
        style={{ background: "rgba(213, 147, 255, 0.15)", color: "var(--color-purple)" }}
      >
        {t("game.role.guesser")}
      </span>
    );
  }

  // --- Filter/Validate phases: filter player is "working", others are "ready" ---
  if (phase === "filter" || phase === "validate") {
    if (isFilterPlayer) {
      return (
        <span
          className="game-player__badge game-player__badge--thinking"
          style={{ animationDelay: `${playerId * 0.4}s`, background: "rgba(255, 214, 0, 0.15)", color: "#ffd600" }}
        >
          {t("game.badge.working")}
        </span>
      );
    }
    return <span className="game-player__badge">{t("game.badge.ready")}</span>;
  }

  // --- Clue phase: show "submitted" or "thinking" based on clue status ---
  if (phase === "clue") {
    if (hasSubmitted) {
      return <span className="game-player__badge">{t("game.badge.submitted")}</span>;
    }
    return (
      <span
        className="game-player__badge game-player__badge--thinking"
        style={{ animationDelay: `${playerId * 0.4}s` }}
      >
        {t("game.badge.thinking")}
      </span>
    );
  }

  // --- Guess phase (non-guesser): everyone is ready ---
  if (phase === "guess") {
    return <span className="game-player__badge">{t("game.badge.ready")}</span>;
  }

  return null;
}
