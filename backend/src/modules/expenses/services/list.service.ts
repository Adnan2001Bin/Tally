import { prisma } from "../../../lib/prisma.js";
import {
  toPublicPersonalExpense,
  type PersonalExpensePublic,
} from "../../../models/personal-expense.js";

export async function listExpenses(userId: string): Promise<PersonalExpensePublic[]> {
  const expenses = await prisma.personalExpense.findMany({
    where: { user_id: userId },
    include: {
      source_group_expense: { select: { created_by: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return expenses.map(toPublicPersonalExpense);
}
