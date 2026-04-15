interface ScoreTrackerProps {
  points: number;
  lostPoints: number;
  results: Record<number, "right" | "wrong" | "pass">;
}

function buildDots(results: Record<number, "right" | "wrong" | "pass">) {
  const dots: ("correct" | "lost" | "pass" | "neutral")[] = [];
  const sortedRounds = Object.keys(results)
    .map(Number)
    .sort((a, b) => a - b);

  for (const r of sortedRounds) {
    const result = results[r];
    if (result === "right") dots.push("correct");
    else if (result === "wrong") { dots.push("lost"); dots.push("lost"); }
    else if (result === "pass") dots.push("pass");
  }

  while (dots.length < 13) dots.push("neutral");
  return dots.slice(0, 13);
}

export default function ScoreTracker({ points, lostPoints, results }: ScoreTrackerProps) {
  const hasResults = Object.keys(results).length > 0;

  const dots = hasResults
    ? buildDots(results)
    : Array.from({ length: 13 }, (_, i) => {
        if (i < points) return "correct" as const;
        if (i < points + lostPoints) return "lost" as const;
        return "neutral" as const;
      });

  return (
    <div className="score-tracker">
      {dots.map((type, i) => (
        <div
          key={i}
          className={`score-dot${type === "correct" ? " score-dot--correct" : type === "lost" ? " score-dot--lost" : type === "pass" ? " score-dot--pass" : ""}`}
        />
      ))}
    </div>
  );
}
