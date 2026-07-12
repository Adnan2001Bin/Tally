export const EXPENSE_CATEGORIES = [
  "food",
  "grocery",
  "transport",
  "bills",
  "fun",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type SplitMethod = "equal" | "exact";

export interface ParseExpenseRequest {
  text: string;
  members: string[];
  currency_symbol?: string;
}

export interface ParseExpensePayer {
  name: string;
  amount: number;
}

export interface ParseExpenseResponse {
  description: string;
  category: ExpenseCategory;
  total: number;
  payers: ParseExpensePayer[];
  participants: string[];
  split_method: SplitMethod;
  split_values: Record<string, number> | null;
  ambiguous_names: string[];
}
