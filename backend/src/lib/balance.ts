// Port of tally core balance math — pure, integer minor units.

export type MemberId = string;
export type MinorUnits = number;
export type SplitMethod = "equal" | "exact" | "percent" | "shares";

export type SplitInput = {
  method: SplitMethod;
  participants: MemberId[];
  values?: Record<MemberId, number>;
};

export type ExpenseEvent = {
  kind: "expense";
  id: string;
  total: MinorUnits;
  payers: { member: MemberId; amount: MinorUnits }[];
  split: SplitInput;
};

export type SettlementEvent = {
  kind: "settlement";
  id: string;
  from: MemberId;
  to: MemberId;
  amount: MinorUnits;
};

export type GroupEvent = ExpenseEvent | SettlementEvent;
export type Balances = Record<MemberId, MinorUnits>;

function roundMinor(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

function compareMemberId(a: MemberId, b: MemberId): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a.trim() !== "" && Number.isFinite(na);
  const bNum = b.trim() !== "" && Number.isFinite(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  if (aNum && bNum) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

function allocateResidual(
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

export function computeOwed(total: MinorUnits, split: SplitInput): Record<MemberId, MinorUnits> {
  const parts = [...split.participants];
  const n = parts.length;
  const out: Record<MemberId, MinorUnits> = {};
  if (n === 0) return out;

  switch (split.method) {
    case "equal": {
      const ordered = [...parts].sort(compareMemberId);
      const base = Math.trunc(total / n);
      const rem = total - base * n;
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
        throw new Error(`exact split sums to ${s}, expected ${total}`);
      }
      return out;
    }
    case "percent": {
      const vals = split.values ?? {};
      const raw = parts.map((m) => vals[m] ?? 0);
      const denom = sum(raw) || 1;
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

function expenseDelta(e: ExpenseEvent): Balances {
  const owed = computeOwed(e.total, e.split);
  const delta: Balances = {};
  const addTo = (m: MemberId, d: MinorUnits) => {
    delta[m] = (delta[m] ?? 0) + d;
  };
  for (const p of e.payers) addTo(p.member, p.amount);
  for (const m of Object.keys(owed)) addTo(m, -owed[m]);
  return delta;
}

export function balanceFromEvents(events: GroupEvent[]): Balances {
  const balances: Balances = {};
  const addTo = (m: MemberId, d: MinorUnits) => {
    balances[m] = (balances[m] ?? 0) + d;
  };

  for (const e of events) {
    if (e.kind === "expense") {
      const d = expenseDelta(e);
      for (const m of Object.keys(d)) addTo(m, d[m]);
    } else {
      addTo(e.from, e.amount);
      addTo(e.to, -e.amount);
    }
  }
  return balances;
}

export function personalShare(e: ExpenseEvent, me: MemberId): MinorUnits {
  return computeOwed(e.total, e.split)[me] ?? 0;
}
