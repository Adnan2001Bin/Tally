import { randomBytes } from "node:crypto";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short invite code for share links, e.g. ABCD123. */
export function generateInviteCode(length = 7): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return code;
}

/** Convert major currency units (e.g. 12.50 BDT) to integer minor units (paisa). */
export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert minor units back to major units with two decimal places. */
export function fromMinor(minor: number): number {
  return Number((minor / 100).toFixed(2));
}

export function decimalToNumber(value: { toFixed: (n: number) => string }): number {
  return Number(value.toFixed(2));
}
