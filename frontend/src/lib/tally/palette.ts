// Centralized color maps from the mockup — the only place data-driven hex lives.
// Static UI colors come from Tailwind @theme tokens (bg-paper, text-ink, …).

export const catColor: Record<string, string> = {
  food: "#C2693E",
  grocery: "#3F8E5B",
  transport: "#C9A24B",
  bills: "#8A847A",
  fun: "#6E7FB0",
  other: "#8A847A",
};

export const catLabel: Record<string, string> = {
  food: "Food & dining",
  grocery: "Groceries",
  transport: "Transport",
  bills: "Rent & bills",
  fun: "Fun",
  other: "Other",
};

export function catIcon(cat: string): string {
  return (
    ({ food: "food", grocery: "grocery", transport: "transport", bills: "bills", fun: "fun" } as Record<
      string,
      string
    >)[cat] || "other"
  );
}

export type Rel = "owe" | "owed" | "settled";

export function avatarColors(rel: Rel): { bg: string; fg: string } {
  if (rel === "owed") return { bg: "#EAF1EC", fg: "#3F8E5B" };
  if (rel === "owe") return { bg: "#F6EBE4", fg: "#C2693E" };
  return { bg: "#F0ECE4", fg: "#8A847A" };
}

// semantic ink/accent constants for inline use where a Tailwind class is awkward
export const INK = "#211E1A";
export const INK_SOFT = "#4A453E";
export const STONE = "#8A847A";
export const STONE_2 = "#A39A8C";
export const TERRACOTTA = "#C2693E";
export const GREEN = "#3F8E5B";
export const PAPER = "#FAF8F3";
export const LINE = "#ECE7DE";
export const ACCENT = "#C2693E";
