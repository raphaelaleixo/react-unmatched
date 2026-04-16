import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ScoreTracker from "./ScoreTracker";

describe("ScoreTracker", () => {
  it("renders 13 dots", () => {
    const { container } = render(<ScoreTracker results={{}} />);
    const dots = container.querySelectorAll(".score-dot");
    expect(dots).toHaveLength(13);
  });

  it("marks correct dots", () => {
    const { container } = render(
      <ScoreTracker results={{ 0: "right", 1: "right", 2: "right" }} />,
    );
    const correct = container.querySelectorAll(".score-dot--correct");
    expect(correct).toHaveLength(3);
  });

  it("marks lost dots", () => {
    const { container } = render(
      <ScoreTracker results={{ 0: "wrong", 1: "wrong" }} />,
    );
    const lost = container.querySelectorAll(".score-dot--lost");
    expect(lost).toHaveLength(2);
  });

  it("marks pass dots", () => {
    const { container } = render(
      <ScoreTracker results={{ 0: "pass" }} />,
    );
    const pass = container.querySelectorAll(".score-dot--pass");
    expect(pass).toHaveLength(1);
  });

  it("remaining dots are neutral", () => {
    const { container } = render(
      <ScoreTracker results={{ 0: "right", 1: "wrong", 2: "pass" }} />,
    );
    const all = container.querySelectorAll(".score-dot");
    const correct = container.querySelectorAll(".score-dot--correct");
    const lost = container.querySelectorAll(".score-dot--lost");
    const pass = container.querySelectorAll(".score-dot--pass");
    expect(all.length - correct.length - lost.length - pass.length).toBe(10);
  });
});
