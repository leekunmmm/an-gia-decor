import React from "react";

const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("vi", { granularity: "grapheme" })
    : null;

function splitGraphemes(word: string): string[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

export function renderSplitChars(text: string): React.ReactNode {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let charIndex = 0;

  return words.map((word, wordIdx) => {
    const chars = splitGraphemes(word);
    return (
      <React.Fragment key={`${word}-${wordIdx}`}>
        {wordIdx > 0 ? " " : null}
        <span
          aria-hidden="true"
          className="v2-split-word"
          style={{ "--word-index": wordIdx } as React.CSSProperties}
        >
          {chars.map((ch, cIdx) => {
            const currentIdx = charIndex++;
            return (
              <span
                key={`${ch}-${cIdx}`}
                className="v2-split-char"
                style={{ "--char-index": currentIdx } as React.CSSProperties}
              >
                {ch}
              </span>
            );
          })}
        </span>
      </React.Fragment>
    );
  });
}
