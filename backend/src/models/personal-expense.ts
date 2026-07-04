import type { PersonalExpense as PrismaPersonalExpense } from "@prisma/client";

/** Public personal expense — amount serialized as a number for JSON clients. */
export type PersonalExpensePublic = Omit<PrismaPersonalExpense, "amount"> & {
  amount: number;
};

export type PersonalExpenseCreateInput = {
  amount: number;
  description: string;
  currency?: string;
};

export type PersonalExpenseUpdateInput = Partial<PersonalExpenseCreateInput>;

export function toPublicPersonalExpense(
  expense: PrismaPersonalExpense,
): PersonalExpensePublic {
  return {
    ...expense,
    amount: Number(expense.amount.toFixed(2)),
  };
}
