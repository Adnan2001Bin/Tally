export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  currency: string;
  created_at: string;
  updated_at: string;
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
