import { prisma } from "../../../lib/prisma.js";
import {
  toPublicPersonalExpense,
  type PersonalExpensePublic,
} from "../../../models/personal-expense.js";
import type { CreateExpenseInput } from "../expenses.types.js";

const DEFAULT_CURRENCY = "BDT";

export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<PersonalExpensePublic> {
  const expense = await prisma.personalExpense.create({
    data: {
      user_id: userId,
      amount: input.amount,
      description: input.description.trim(),
      currency: (input.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    },
  });

  return toPublicPersonalExpense(expense);
}
