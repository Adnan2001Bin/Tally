import { prisma } from "../../../lib/prisma.js";
import {
  toPublicPersonalExpense,
  type PersonalExpensePublic,
} from "../../../models/personal-expense.js";
import { ExpenseError } from "../expenses.types.js";

export async function getExpense(
  userId: string,
  expenseId: string,
): Promise<PersonalExpensePublic> {
  const expense = await prisma.personalExpense.findFirst({
    where: { id: expenseId, user_id: userId },
  });

  if (!expense) {
    throw new ExpenseError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }

  return toPublicPersonalExpense(expense);
}
