import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ScoreTracker from "./ScoreTracker";

describe("ScoreTracker", () => {
  it("renders 13 dots", () => {
    const { container } = render(<ScoreTracker points={0} lostPoints={0} />);
    const dots = container.querySelectorAll(".score-dot");
    expect(dots).toHaveLength(13);
  });

  it("marks correct dots green", () => {
    const { container } = render(<ScoreTracker points={3} lostPoints={0} />);
    const correct = container.querySelectorAll(".score-dot--correct");
    expect(correct).toHaveLength(3);
  });

  it("marks lost dots red", () => {
    const { container } = render(<ScoreTracker points={2} lostPoints={4} />);
    const lost = container.querySelectorAll(".score-dot--lost");
    expect(lost).toHaveLength(4);
  });

  it("remaining dots are neutral", () => {
    const { container } = render(<ScoreTracker points={2} lostPoints={3} />);
    const all = container.querySelectorAll(".score-dot");
    const correct = container.querySelectorAll(".score-dot--correct");
    const lost = container.querySelectorAll(".score-dot--lost");
    expect(all.length - correct.length - lost.length).toBe(8);
  });
});
