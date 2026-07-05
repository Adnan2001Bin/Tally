const PENDING_GROUP_INVITE_KEY = "tally_pending_group_invite";

export function savePendingGroupInvite(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_GROUP_INVITE_KEY, code.trim().toUpperCase());
}

export function getPendingGroupInvite(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_GROUP_INVITE_KEY);
}

export function clearPendingGroupInvite(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_GROUP_INVITE_KEY);
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/^TALLY-/i, "");
}
