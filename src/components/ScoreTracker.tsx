interface ScoreTrackerProps {
  points: number;
  lostPoints: number;
}

export default function ScoreTracker({ points, lostPoints }: ScoreTrackerProps) {
  const dots = Array.from({ length: 13 }, (_, i) => {
    if (i < points) return "correct";
    if (i < points + lostPoints) return "lost";
    return "neutral";
  });

  return (
    <div className="score-tracker">
      {dots.map((type, i) => (
        <div
          key={i}
          className={`score-dot${type === "correct" ? " score-dot--correct" : type === "lost" ? " score-dot--lost" : ""}`}
        />
      ))}
    </div>
  );
}
