// Tally deterministic core — domain types (spec §3, §6).
// Pure data shapes. No IO, no UI, no clock. Money is always integer MINOR units.

export type MinorUnits = number; // integer paisa/cents; never float
export type MemberId = string; // stable per-membership id used by all math (§3)

export type SplitMethod = "equal" | "exact" | "percent" | "shares";

export interface Payer {
  member: MemberId;
  amount: MinorUnits; // what this member fronted
}

/**
 * How a total divides among participants (§6.2).
 * - equal:  values ignored
 * - exact:  values[m] = that member's owed in MINOR units (must sum to total)
 * - percent: values[m] = percentage (accepts 0..1 or 0..100; normalised internally)
 * - shares:  values[m] = relative weight (any positive number)
 */
export interface SplitInput {
  method: SplitMethod;
  participants: MemberId[];
  values?: Record<MemberId, number>;
}

export interface ExpenseEvent {
  kind: "expense";
  id: string;
  /** the bill total in minor units (paid-by side and split-among side both equal this) */
  total: MinorUnits;
  payers: Payer[];
  split: SplitInput;
  /** id of a prior event this one corrects (history is immutable — corrections are new events, §6.3/FR-04.5) */
  corrects?: string;
}

/** A → B transfer of `amount` clearing debt. Not real money — a recorded fact (§6.3). */
export interface SettlementEvent {
  kind: "settlement";
  id: string;
  from: MemberId; // payer (pays down their debt)
  to: MemberId; // recipient
  amount: MinorUnits;
  corrects?: string;
}

export type GroupEvent = ExpenseEvent | SettlementEvent;

export type Owed = Record<MemberId, MinorUnits>;
export type Balances = Record<MemberId, MinorUnits>;

export interface Transfer {
  from: MemberId;
  to: MemberId;
  amount: MinorUnits;
}

// ---- meal tracker (§6.5) -------------------------------------------------

export type FixedBasis = "per_head" | "by_days";

export interface MealPurchase {
  member: MemberId;
  amount: MinorUnits;
}

export interface MealCount {
  member: MemberId;
  count: number; // meals eaten in the cycle (0 off, 1 default, 2 double, +1 guest…)
}

export interface FixedExpense {
  paidBy: MemberId;
  amount: MinorUnits;
  basis: FixedBasis;
}

export interface MealCycleInput {
  members: MemberId[];
  mealPurchases: MealPurchase[]; // basis `meal`
  meals: MealCount[];
  fixedExpenses?: FixedExpense[]; // basis per_head / by_days
  daysPresent?: Record<MemberId, number>; // for by_days proration (FR-08.6)
  ordinaryDelta?: Record<MemberId, MinorUnits>; // any normal group-expense deltas in the cycle
}

export interface MealCycleResult {
  mealRate: number; // non-integer pool/meals (the only non-integer intermediate, §6.1)
  totalPool: MinorUnits;
  totalMeals: number;
  consumption: Record<MemberId, number>; // exact (pre-round) cost of meals eaten
  cycleNet: Balances; // rounded, integer minor units, Σ = 0
  transfers: Transfer[];
}
