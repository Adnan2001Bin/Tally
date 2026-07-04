import type { PersonalExpensePublic } from "../../models/personal-expense.js";

export type { PersonalExpensePublic };

export type CreateExpenseInput = {
  amount: number;
  description: string;
  currency?: string;
};

export type UpdateExpenseInput = {
  amount?: number;
  description?: string;
  currency?: string;
};

export class ExpenseError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ExpenseError";
  }
}
