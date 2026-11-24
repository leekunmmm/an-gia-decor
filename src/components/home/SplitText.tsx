import React from "react";

type SplitMode = "chars-alternate" | "chars-fade" | "words-fade";

interface SplitTextProps {
  text: string;
  mode: SplitMode;
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
  delaySeconds?: number;
}

export function SplitText({
  text,
  mode,
  as: Tag = "h2",
  className = "",
  delaySeconds = 0,
}: SplitTextProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const modeClasses =
    mode === "chars-alternate"
      ? "is-chars is-alternate"
      : mode === "chars-fade"
      ? "is-chars is-fade"
      : "is-words is-fade";

  const rootStyle = delaySeconds
    ? ({ "--split-delay": `${delaySeconds}s` } as React.CSSProperties)
    : undefined;

  if (mode === "words-fade") {
    return (
      <Tag className={`v2-split ${modeClasses} ${className}`.trim()} style={rootStyle}>
        {words.map((word, wIdx) => (
          <React.Fragment key={`${wIdx}-${word}`}>
            <span
              className="v2-split-word"
              style={{ "--word-index": wIdx } as React.CSSProperties}
            >
              {word}
            </span>
            {wIdx < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  let charCounter = 0;
  return (
    <Tag className={`v2-split ${modeClasses} ${className}`.trim()} style={rootStyle}>
      {words.map((word, wIdx) => {
        const chars = Array.from(word);
        return (
          <React.Fragment key={`${wIdx}-${word}`}>
            <span className="v2-split-word">
              {chars.map((ch, cIdx) => {
                const idx = charCounter++;
                return (
                  <span
                    key={`${idx}-${cIdx}`}
                    className="v2-split-char"
                    style={{ "--char-index": idx } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
            {wIdx < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
