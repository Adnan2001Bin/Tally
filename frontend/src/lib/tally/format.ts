// Money formatting — taka, exact match to the mockup's fmt().
// Display only; all math is integer minor units in @/lib/core.
export function taka(n: number): string {
  return "৳" + Math.round(n).toLocaleString("en-US");
}

export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
