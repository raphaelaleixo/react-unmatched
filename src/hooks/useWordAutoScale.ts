/**
 * useWordAutoScale — shrinks a word's font size so it fits within its parent container.
 *
 * Attach the returned ref to a <span> (or similar inline element) that holds
 * the word text. The hook measures the element's natural scroll width against
 * the parent's client width and scales the font down when the word overflows.
 *
 * Re-measures on window resize and whenever `word` changes.
 *
 * @param word - the current word string (triggers re-measure when it changes)
 * @returns a React ref to attach to the word element
 */
import { useCallback, useEffect, useRef } from "react";

export function useWordAutoScale(word: string) {
  const wordRef = useRef<HTMLSpanElement>(null);

  const fitWord = useCallback(() => {
    const el = wordRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    // Reset font size to CSS default so we measure the natural width
    el.style.fontSize = "";
    const parentWidth = parent.clientWidth;
    const scrollWidth = el.scrollWidth;

    if (scrollWidth > 0) {
      const scale = parentWidth / scrollWidth;
      const baseFontSize = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${baseFontSize * scale}px`;
    }
  }, []);

  useEffect(() => {
    fitWord();
    window.addEventListener("resize", fitWord);
    return () => window.removeEventListener("resize", fitWord);
  }, [word, fitWord]);

  return wordRef;
}
