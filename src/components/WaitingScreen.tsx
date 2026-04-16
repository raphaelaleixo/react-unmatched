/**
 * WaitingScreen — a full-height placeholder shown while a player waits
 * for other players or the current phase to complete.
 *
 * Renders a centered title, a descriptive message, and an animated
 * indeterminate progress bar so the player knows the game is still active.
 *
 * @param title   - bold heading text (e.g. player name or "Waiting…")
 * @param message - explanatory text or JSX (e.g. "Waiting for clues…")
 */
import type { ReactNode } from "react";

interface WaitingScreenProps {
  title: string;
  message: ReactNode;
}

export default function WaitingScreen({ title, message }: WaitingScreenProps) {
  return (
    <div className="waiting-screen">
      <div className="waiting-screen__group">
        <h2>{title}</h2>
        <p className="text-muted">{message}</p>
      </div>
      <div className="progress-bar" />
    </div>
  );
}
