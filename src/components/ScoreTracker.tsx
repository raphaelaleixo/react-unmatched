interface ScoreTrackerProps {
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
    else if (result === "wrong") dots.push("lost");
    else if (result === "pass") dots.push("pass");
  }

  while (dots.length < 13) dots.push("neutral");
  return dots.slice(0, 13);
}

export default function ScoreTracker({ results }: ScoreTrackerProps) {
  const dots = buildDots(results);

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
