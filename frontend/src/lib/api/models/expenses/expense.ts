export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  currency: string;
  created_at: string;
  updated_at: string;
  /** Set when this row mirrors a group expense share. */
  source_group_expense_id?: string | null;
  /** Who created the linked group expense, if applicable. */
  source_group_created_by?: string | null;
};

export type CreateExpenseBody = {
  amount: number;
  description: string;
  currency?: string;
};

export type UpdateExpenseBody = {
  amount?: number;
  description?: string;
  currency?: string;
};

export type ExpensesList = {
  expenses: Expense[];
};

export type ExpenseDetail = {
  expense: Expense;
};
