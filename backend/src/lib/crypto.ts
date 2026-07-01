import { createHash, randomBytes } from "node:crypto";

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

/** Store only a hash of refresh tokens in the database. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
