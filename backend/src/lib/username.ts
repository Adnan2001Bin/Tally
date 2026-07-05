/** Build a unique username handle from a display name or email local-part. */
export function baseUsernameFrom(displayName: string, email: string): string {
  const fromName = displayName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  let base = fromName.length >= 3 ? fromName : "";
  if (!base) {
    base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  if (base.length < 3) base = "user";
  return base.slice(0, 26);
}

export function withUsernameSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(3, 30 - suffix.length));
  return `${trimmed}${suffix}`.slice(0, 30);
}
