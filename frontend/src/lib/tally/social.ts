// Pure social/QoL logic (no React, no IO) so it's unit-testable in isolation.
import type { Notification, NotifKind } from "./types";

let seq = 0;

/** A fresh unread notification. `id` overridable for deterministic tests. */
export function makeNotif(text: string, kind: NotifKind, id?: string): Notification {
  return { id: id ?? `nt${++seq}_${Math.round(performance.now?.() ?? 0)}_${seq}`, text, kind, when: "just now", read: false };
}

export function groupExpenseNotifText(title: string, amountText: string, group: string): string {
  return `You added ${title || "an expense"} (${amountText}) to ${group}`;
}

/** Resolve an invite code (e.g. "tally-4qxr") against known group codes → group id or null. */
export function resolveInvite(code: string, groupCodes: Record<string, string>): string | null {
  const norm = code.trim().toUpperCase();
  for (const [gid, c] of Object.entries(groupCodes)) {
    if (c.toUpperCase() === norm) return gid;
  }
  return null;
}

/** Toggle dispute on an entry id — returns a NEW map (never mutates the input). */
export function toggleDispute(disputed: Record<string, boolean>, id: string): Record<string, boolean> {
  return { ...disputed, [id]: !disputed[id] };
}

/** Capture text to pre-fill when editing an entry. Carries no id, so confirming
 *  produces a brand-new entry (immutable history — never mutate the original). */
export function prefillText(title: string, amount: number): string {
  return `${title} ${amount}`.trim();
}
