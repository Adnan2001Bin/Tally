import { prisma } from "../../../lib/prisma.js";
import {
  toPublicPersonalExpense,
  type PersonalExpensePublic,
} from "../../../models/personal-expense.js";
import type { UpdateExpenseInput } from "../expenses.types.js";
import { ExpenseError } from "../expenses.types.js";

export async function updateExpense(
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<PersonalExpensePublic> {
  const existing = await prisma.personalExpense.findFirst({
    where: { id: expenseId, user_id: userId },
    select: { id: true },
  });

  if (!existing) {
    throw new ExpenseError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }

  const expense = await prisma.personalExpense.update({
    where: { id: expenseId },
    data: {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      ...(input.currency !== undefined
        ? { currency: input.currency.toUpperCase() }
        : {}),
    },
  });

  return toPublicPersonalExpense(expense);
}
