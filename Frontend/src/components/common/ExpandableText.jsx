import React, { useState } from "react";

const ExpandableText = ({ text, linesLimit = 3, charLimit = 180 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const lines = text.split("\n");
  const isLongByLines = lines.length > linesLimit;
  const isLongByChars = text.length > charLimit;
  const isLong = isLongByLines || isLongByChars;

  let truncatedText = text;
  if (isLong && !isExpanded) {
    if (isLongByLines) {
      truncatedText = lines.slice(0, linesLimit).join("\n");
    } else {
      truncatedText = text.slice(0, charLimit);
    }
  }

  return (
    <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {isLong && !isExpanded ? (
        <>
          {truncatedText}...{" "}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontWeight: "600",
              cursor: "pointer",
              padding: "0 2px",
              fontSize: "0.92em",
              display: "inline-block",
              textDecoration: "underline"
            }}
          >
            more...
          </button>
        </>
      ) : (
        <>
          {text}{" "}
          {isLong && isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                fontWeight: "600",
                cursor: "pointer",
                padding: "0 2px",
                fontSize: "0.92em",
                display: "inline-block",
                textDecoration: "underline"
              }}
            >
              show less
            </button>
          )}
        </>
      )}
    </p>
  );
};

export default ExpandableText;
