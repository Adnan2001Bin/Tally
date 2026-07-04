import React from "react";

// Shared primitives that recur across the mockup screens.
export const serif: React.CSSProperties = { fontFamily: "var(--font-serif)" };

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        font: "600 11px var(--font-sans)",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--muted-2)",
        padding: "18px 26px 4px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// The standard scrollable screen body: absolute inset-0, scrolls, bottom padding for the nav.
export function ScreenScroll({ children, pad = "8px 0 110px", style }: { children: React.ReactNode; pad?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: pad, ...style }}>
      {children}
    </div>
  );
}

export function BackLink({ label, onClick, testid }: { label: string; onClick: () => void; testid?: string }) {
  return (
    <span onClick={onClick} data-testid={testid} style={{ font: "600 14px var(--font-sans)", color: "var(--muted)", cursor: "pointer" }}>
      {label}
    </span>
  );
}
