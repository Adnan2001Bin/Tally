// Tally deterministic core (spec §6) — pure, IO-free, framework-free.
// The language model NEVER runs any of this; all money math lives here.
// Cross-cutting invariants (§10): sum-zero, determinism, integer minor units,
// deterministic rounding, transfers reconcile exactly to balances.

import type {
  Balances,
  ExpenseEvent,
  FixedExpense,
  GroupEvent,
  MealCycleInput,
  MealCycleResult,
  MemberId,
  MinorUnits,
  Owed,
  SplitInput,
  Transfer,
} from "./types";

export * from "./types";

/** Round half away from zero to an integer (used wherever money is divided, §6.6). */
export function roundMinor(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/**
 * Compare member ids "ascending". Numeric-looking ids compare numerically,
 * everything else lexicographically — so ordering is stable and deterministic
 * for the §6.2 equal residual and the §6.6 tie-break (lowest member_id).
 */
export function compareMemberId(a: MemberId, b: MemberId): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a.trim() !== "" && Number.isFinite(na);
  const bNum = b.trim() !== "" && Number.isFinite(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  if (aNum && bNum) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * §6.6 rounding rule. `figures` are exact (possibly fractional) per-member
 * amounts; round each to minor units, then assign the whole residual
 * (target − Σ rounded) to the member with the largest |figure|, tie-broken by
 * lowest member_id, so the set sums to `target` EXACTLY.
 */
export function allocateResidual(
  ids: MemberId[],
  figures: number[],
  target: MinorUnits,
): MinorUnits[] {
  const rounded = figures.map(roundMinor);
  const residual = target - sum(rounded);
  if (residual !== 0 && ids.length > 0) {
    let best = 0;
    for (let i = 1; i < ids.length; i++) {
      const fi = Math.abs(figures[i]);
      const fb = Math.abs(figures[best]);
      if (fi > fb || (fi === fb && compareMemberId(ids[i], ids[best]) < 0)) best = i;
    }
    rounded[best] += residual;
  }
  return rounded;
}

// --- §6.2 expense → owed per participant ----------------------------------

export class SplitError extends Error {
  constructor(
    message: string,
    /** which side is off and by how much (FR-04.4) */
    public readonly offBy: MinorUnits,
    public readonly side: "owed" | "paid",
  ) {
    super(message);
    this.name = "SplitError";
  }
}

/**
 * Map (total, split) → owed[member] with Σ owed = total EXACTLY (§6.2 / §6.6).
 * Throws SplitError on an `exact` split that doesn't reconcile (FR-04.4).
 */
export function computeOwed(total: MinorUnits, split: SplitInput): Owed {
  const parts = [...split.participants];
  const n = parts.length;
  const out: Owed = {};
  if (n === 0) return out;

  switch (split.method) {
    case "equal": {
      // base = T div n; first `rem` participants by ascending member_id get base+1.
      const ordered = [...parts].sort(compareMemberId);
      const base = Math.trunc(total / n);
      const rem = total - base * n; // 0 <= rem < n for non-negative total
      ordered.forEach((m, i) => {
        out[m] = base + (i < rem ? 1 : 0);
      });
      return out;
    }
    case "exact": {
      const vals = split.values ?? {};
      let s = 0;
      for (const m of parts) {
        out[m] = Math.trunc(vals[m] ?? 0);
        s += out[m];
      }
      if (s !== total) {
        throw new SplitError(
          `exact split sums to ${s}, expected ${total}`,
          total - s,
          "owed",
        );
      }
      return out;
    }
    case "percent": {
      const vals = split.values ?? {};
      const raw = parts.map((m) => vals[m] ?? 0);
      const denom = sum(raw) || 1; // accepts 0..1 or 0..100 — normalise by actual total
      const figures = parts.map((_, i) => (total * raw[i]) / denom);
      const rounded = allocateResidual(parts, figures, total);
      parts.forEach((m, i) => (out[m] = rounded[i]));
      return out;
    }
    case "shares": {
      const vals = split.values ?? {};
      const w = parts.map((m) => vals[m] ?? 0);
      const denom = sum(w) || 1;
      const figures = parts.map((_, i) => (total * w[i]) / denom);
      const rounded = allocateResidual(parts, figures, total);
      parts.forEach((m, i) => (out[m] = rounded[i]));
      return out;
    }
  }
}

/**
 * §7: the model extracts facts; CODE owns the total. When the model gives no
 * total (or a hallucinated one), the total is Σ payer amounts — payers + method
 * are the source of truth, so a garbage `total_minor` can't corrupt the split (GT-10).
 */
export function totalFromPayers(payers: { amount: MinorUnits }[]): MinorUnits {
  return sum(payers.map((p) => p.amount));
}

/** Validate the paid-by side reconciles to the total (FR-04.4). */
export function validateExpense(e: ExpenseEvent): void {
  const paid = sum(e.payers.map((p) => p.amount));
  if (paid !== e.total) {
    throw new SplitError(
      `payers total ${paid}, expected ${e.total}`,
      e.total - paid,
      "paid",
    );
  }
  // computeOwed throws for an unreconciled exact split.
  computeOwed(e.total, e.split);
}

// --- §6.3 balance from events ---------------------------------------------

const addTo = (b: Balances, m: MemberId, d: MinorUnits) => {
  b[m] = (b[m] ?? 0) + d;
};

/**
 * Per-member delta for one expense: delta = paid − owed (§6.3).
 * Σ delta = Σ paid − Σ owed = T − T = 0.
 */
export function expenseDelta(e: ExpenseEvent): Balances {
  const owed = computeOwed(e.total, e.split);
  const delta: Balances = {};
  for (const p of e.payers) addTo(delta, p.member, p.amount);
  for (const m of Object.keys(owed)) addTo(delta, m, -owed[m]);
  return delta;
}

/**
 * Resolve immutable-history corrections to the set of LIVE events (FR-04.5 / FR-10.3).
 * "last-writer-wins applies only to corrections of the same event": when several
 * events correct the same original, only the last writer (by array order = write
 * order) survives — the original and every losing correction are superseded.
 * Correction chains (C corrects B corrects A) collapse to their tip. A malformed
 * self-correction (corrects === own id) is ignored, not allowed to erase itself.
 */
export function liveEvents<T extends { id: string; corrects?: string }>(events: T[]): T[] {
  const winnerFor = new Map<string, string>(); // target id → winning correction id (last write)
  for (const e of events) {
    if (e.corrects && e.corrects !== e.id) winnerFor.set(e.corrects, e.id);
  }
  const dead = new Set<string>();
  for (const target of winnerFor.keys()) dead.add(target); // the corrected original dies
  for (const e of events) {
    if (e.corrects && e.corrects !== e.id && winnerFor.get(e.corrects) !== e.id) {
      dead.add(e.id); // a non-winning correction of the same target dies
    }
  }
  return events.filter((e) => !dead.has(e.id));
}

/**
 * Derive balances from a group's events (§6.3). Never stored as source of truth.
 */
export function balanceFromEvents(events: GroupEvent[]): Balances {
  const live = liveEvents(events);

  const balances: Balances = {};
  for (const e of live) {
    if (e.kind === "expense") {
      const d = expenseDelta(e);
      for (const m of Object.keys(d)) addTo(balances, m, d[m]);
    } else {
      // settlement A → B of S: delta[A] = +S (paid down debt), delta[B] = −S.
      addTo(balances, e.from, e.amount);
      addTo(balances, e.to, -e.amount);
    }
  }
  return balances;
}

// --- §6.4 debt simplification (fewest transfers) --------------------------

/**
 * Greedy min-cash-flow on balances (Σ balance = 0, integer minor units).
 * Per debtor Σ outgoing = |balance|; per creditor Σ incoming = balance;
 * transfer count ≤ n − 1. Greedy, not provably minimal (true min is NP-hard) —
 * the accepted good-enough standard (§6.4).
 */
export function simplifyTransfers(balances: Balances): Transfer[] {
  type Bal = { m: MemberId; a: MinorUnits };
  // sort by amount desc, tie-broken by member_id asc — fully deterministic
  const byAmtDesc = (x: Bal, y: Bal) =>
    y.a - x.a || compareMemberId(x.m, y.m);

  const creditors: Bal[] = Object.entries(balances)
    .filter(([, b]) => b > 0)
    .map(([m, b]) => ({ m, a: b }))
    .sort(byAmtDesc);
  const debtors: Bal[] = Object.entries(balances)
    .filter(([, b]) => b < 0)
    .map(([m, b]) => ({ m, a: -b }))
    .sort(byAmtDesc);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = Math.min(d.a, c.a);
    if (pay > 0) transfers.push({ from: d.m, to: c.m, amount: pay });
    d.a -= pay;
    c.a -= pay;
    if (d.a === 0) i++;
    if (c.a === 0) j++;
  }
  return transfers;
}

// --- §6.6 bridge: personal projection -------------------------------------

/**
 * The current user's own share of a group expense, posted to their private
 * personal ledger (FR-06 / GT-7). Pure derivation from the expense.
 */
export function personalShare(e: ExpenseEvent, me: MemberId): MinorUnits {
  return computeOwed(e.total, e.split)[me] ?? 0;
}

// --- §6.5 meal-rate reconciliation ----------------------------------------

function fixedShares(
  members: MemberId[],
  fixed: FixedExpense[],
  daysPresent: Record<MemberId, number>,
): { paidFixed: Balances; fixedShare: Balances } {
  const paidFixed: Balances = {};
  const fixedShare: Balances = {};
  for (const m of members) {
    paidFixed[m] = 0;
    fixedShare[m] = 0;
  }
  for (const f of fixed) {
    addTo(paidFixed, f.paidBy, f.amount);
    if (f.basis === "per_head") {
      // equal across members present (FR-08.6 via daysPresent>0 = present)
      const present = members.filter((m) => (daysPresent[m] ?? 1) > 0);
      const owed = computeOwed(f.amount, { method: "equal", participants: present });
      for (const m of present) addTo(fixedShare, m, owed[m]);
    } else {
      // by_days: weighted by days_present / Σ days_present
      const totalDays = sum(members.map((m) => daysPresent[m] ?? 0));
      const figures = members.map((m) =>
        totalDays > 0 ? (f.amount * (daysPresent[m] ?? 0)) / totalDays : 0,
      );
      const rounded = allocateResidual(members, figures, f.amount);
      members.forEach((m, i) => addTo(fixedShare, m, rounded[i]));
    }
  }
  return { paidFixed, fixedShare };
}

/**
 * Cycle close (§6.5). Exact arithmetic until the final round; cycle_net per
 * member sums to 0 exactly after §6.6 residual assignment; transfers via §6.4.
 * If total meals is zero, the food pool is split by the fixed-cost rule (FR-08.7).
 */
export function mealCycleReconcile(input: MealCycleInput): MealCycleResult {
  const members = [...input.members];
  const days = input.daysPresent ?? {};
  const ordinary = input.ordinaryDelta ?? {};

  const pool = sum(input.mealPurchases.map((p) => p.amount));
  const boughtMeal: Balances = {};
  for (const m of members) boughtMeal[m] = 0;
  for (const p of input.mealPurchases) addTo(boughtMeal, p.member, p.amount);

  const mealsBy: Record<MemberId, number> = {};
  for (const m of members) mealsBy[m] = 0;
  for (const mc of input.meals) mealsBy[mc.member] = (mealsBy[mc.member] ?? 0) + mc.count;
  const totalMeals = sum(members.map((m) => mealsBy[m]));

  const { paidFixed, fixedShare } = fixedShares(
    members,
    input.fixedExpenses ?? [],
    days,
  );

  // FR-08.7 — no meals: split the food pool by the fixed-cost (per-head) rule.
  if (totalMeals === 0) {
    const present = members.filter((m) => (days[m] ?? 1) > 0);
    // if nobody is marked present, fall back to all members (never leave the pool unsplit)
    const splitAmong = present.length ? present : members;
    const poolOwed = computeOwed(pool, { method: "equal", participants: splitAmong });
    const figures = members.map(
      (m) =>
        boughtMeal[m] -
        (poolOwed[m] ?? 0) +
        (paidFixed[m] - fixedShare[m]) +
        (ordinary[m] ?? 0),
    );
    const net = allocateResidual(members, figures, 0);
    const cycleNet: Balances = {};
    members.forEach((m, i) => (cycleNet[m] = net[i]));
    return {
      mealRate: 0,
      totalPool: pool,
      totalMeals: 0,
      consumption: Object.fromEntries(members.map((m) => [m, 0])),
      cycleNet,
      transfers: simplifyTransfers(cycleNet),
    };
  }

  const mealRate = pool / totalMeals; // non-integer; do not round yet (§6.1)
  const consumption: Record<MemberId, number> = {};
  for (const m of members) consumption[m] = (pool * mealsBy[m]) / totalMeals; // multiply first to minimise FP error

  // cycle_net[m] = meal_net + fixed_net + ordinary_delta (Σ = 0 in reals)
  const figures = members.map(
    (m) =>
      boughtMeal[m] -
      consumption[m] +
      (paidFixed[m] - fixedShare[m]) +
      (ordinary[m] ?? 0),
  );
  const net = allocateResidual(members, figures, 0);
  const cycleNet: Balances = {};
  members.forEach((m, i) => (cycleNet[m] = net[i]));

  return {
    mealRate,
    totalPool: pool,
    totalMeals,
    consumption,
    cycleNet,
    transfers: simplifyTransfers(cycleNet),
  };
}
