import { useEffect, type MutableRefObject } from "react";
import { apiExpenseToEntry, entryToCreateBody } from "@/lib/tally/expense-mapper";
import {
  getExpenseErrorMessage,
  useCreateExpenseMutation,
  useExpensesQuery,
} from "@/lib/hooks/use-expenses";
import { useTally } from "@/lib/tally/store";
import type { ExpenseHandlers } from "@/lib/tally/expense-handlers";

type ExpensesBridgeProps = {
  handlersRef: MutableRefObject<ExpenseHandlers | null>;
};

/** Syncs API expenses into the tally store and wires create handlers for signed-in mode. */
export function ExpensesBridge({ handlersRef }: ExpensesBridgeProps) {
  const { data, isSuccess } = useExpensesQuery();
  const createMutation = useCreateExpenseMutation();
  const { actions } = useTally();

  useEffect(() => {
    handlersRef.current = {
      isLive: true,
      createPersonal: async (input: { amount: number; description: string }) => {
        await createMutation.mutateAsync(entryToCreateBody(input));
      },
      getErrorMessage: getExpenseErrorMessage,
    };
  }, [createMutation, handlersRef]);

  useEffect(() => {
    if (!isSuccess || !data) return;
    actions.syncApiPersonalEntries(data.expenses.map(apiExpenseToEntry));
  }, [actions, data, isSuccess]);

  return null;
}
