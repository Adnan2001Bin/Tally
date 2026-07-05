import type { PersonalExpense as PrismaPersonalExpense } from "@prisma/client";

/** Public personal expense — amount serialized as a number for JSON clients. */
export type PersonalExpensePublic = Omit<PrismaPersonalExpense, "amount"> & {
  amount: number;
  source_group_created_by?: string | null;
};

export type PersonalExpenseCreateInput = {
  amount: number;
  description: string;
  currency?: string;
};

export type PersonalExpenseUpdateInput = Partial<PersonalExpenseCreateInput>;

type PersonalExpenseWithSource = PrismaPersonalExpense & {
  source_group_expense?: { created_by: string } | null;
};

export function toPublicPersonalExpense(expense: PersonalExpenseWithSource): PersonalExpensePublic {
  const { source_group_expense, ...rest } = expense;
  return {
    ...rest,
    amount: Number(expense.amount.toFixed(2)),
    source_group_created_by: source_group_expense?.created_by ?? null,
  };
}
