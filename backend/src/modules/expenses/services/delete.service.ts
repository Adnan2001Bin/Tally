import { prisma } from "../../../lib/prisma.js";
import { ExpenseError } from "../expenses.types.js";

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const existing = await prisma.personalExpense.findFirst({
    where: { id: expenseId, user_id: userId },
    select: { id: true },
  });

  if (!existing) {
    throw new ExpenseError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }

  await prisma.personalExpense.delete({
    where: { id: expenseId },
  });
}
