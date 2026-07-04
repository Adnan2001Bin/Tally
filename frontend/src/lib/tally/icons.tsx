import React from "react";

// Line-icon set ported verbatim from the mockup's ic() factory.
// 24×24 viewBox, strokeWidth 1.7, round caps — consistent with docs/Tally.html.

type Paths = React.ReactNode;

const P = (d: string, extra?: Record<string, unknown>) => (
  <path d={d} {...extra} />
);
const C = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} />;

const MAP: Record<string, Paths[]> = {
  home: [P("M3 10.6 12 4l9 6.6"), P("M5.6 9.4V20h12.8V9.4")],
  chart: [P("M4 5v14.5h15.5"), P("M7.5 14.5l3.4-3.4 3 2 4.6-5.2")],
  groups: [C(8.4, 8.8, 3), P("M3.4 20c0-3.2 2.2-5.3 5-5.3s5 2.1 5 5.3"), C(17, 9.4, 2.4), P("M15.6 14.6c2.3-.2 4 1.9 4 4.6")],
  grid: [P("M4.5 4.5h6v6h-6z"), P("M13.5 4.5h6v6h-6z"), P("M4.5 13.5h6v6h-6z"), P("M13.5 13.5h6v6h-6z")],
  plus: [P("M12 5.2v13.6"), P("M5.2 12h13.6")],
  food: [P("M4.5 11h15"), P("M6 11a6 6 0 0 0 12 0"), P("M9.5 4.6c-.9.9-.9 1.9 0 2.8"), P("M14.5 4.6c-.9.9-.9 1.9 0 2.8")],
  grocery: [P("M5.6 8.2h12.8l-1 11.3H6.6L5.6 8.2Z"), P("M9.2 8.2a2.8 2.8 0 0 1 5.6 0")],
  transport: [P("M5 11l1.5-4A2 2 0 0 1 8.4 5.7h7.2A2 2 0 0 1 17.5 7L19 11"), P("M4.6 11h14.8v5H4.6z"), C(8, 16.4, 1.4), C(16, 16.4, 1.4)],
  bills: [P("M6.6 3.6h10.8v16.8l-2.7-1.7-2.7 1.7-2.7-1.7L6.6 20.4V3.6Z"), P("M9.4 8.2h5.2"), P("M9.4 11.6h5.2")],
  fun: [P("M4 8.6h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8.6Z"), P("M14 8.6v9", { strokeDasharray: "1.4 2.2" })],
  other: [C(12, 12, 7.6), P("M12 8.4v3.8l2.4 2.2")],
  swap: [P("M6.5 8.7h11l-3-3"), P("M17.5 15.3h-11l3 3")],
  box: [P("M5 7.6 12 4l7 3.6v8.8L12 20l-7-3.6V7.6Z"), P("M5 7.6 12 11.2l7-3.6"), P("M12 11.2V20")],
  meal: [P("M4.5 11h15"), P("M6 11a6 6 0 0 0 12 0"), P("M9.5 4.4v3"), P("M12 4v3.4"), P("M14.5 4.4v3")],
  user: [C(12, 8, 3.3), P("M5.6 20c0-3.5 2.9-5.8 6.4-5.8s6.4 2.3 6.4 5.8")],
  wallet: [P("M4.5 7.6h12.5a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H6a1.5 1.5 0 0 1-1.5-1.5V7.6Z"), P("M4.5 7.6 16 4.2v3.4"), C(15.8, 13.6, 1)],
  check: [P("M5 12.6l4.4 4.4L19 7.2")],
  clock: [C(12, 12, 7.8), P("M12 7.8v4.4l2.8 1.8")],
  receipt: [P("M6.6 3.6h10.8v16.8l-2.7-1.7-2.7 1.7-2.7-1.7L6.6 20.4V3.6Z"), P("M9.4 8.2h5.2"), P("M9.4 11.6h5.2")],
  link: [P("M9.5 14.5 14.5 9.5"), P("M11 7.5l1.5-1.5a3.5 3.5 0 0 1 5 5L16 12.5"), P("M13 16.5l-1.5 1.5a3.5 3.5 0 0 1-5-5L8 11.5")],
  bell: [P("M6.5 10a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5h-15s2-1.5 2-6.5Z"), P("M10.2 19.5a2 2 0 0 0 3.6 0")],
  arrowR: [P("M5 12h13"), P("M13 6l6 6-6 6")],
  mic: [P("M12 4.5a2.6 2.6 0 0 1 2.6 2.6v4.3a2.6 2.6 0 0 1-5.2 0V7.1A2.6 2.6 0 0 1 12 4.5Z"), P("M6.5 11.2a5.5 5.5 0 0 0 11 0"), P("M12 16.7V20")],
};

export function Icon({
  name,
  color = "#211E1A",
  size = 20,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const paths = (MAP[name] || MAP.other).map((p, i) =>
    React.cloneElement(p as React.ReactElement, { key: i }),
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}
