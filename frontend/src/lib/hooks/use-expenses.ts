import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getExpenses } from "@/lib/api/generated/expenses/expenses";
import type { ApiError } from "@/lib/api/types";
import type { CreateExpenseBody, UpdateExpenseBody } from "@/lib/api/models/expenses/expense";
import type { AxiosError } from "axios";

const expensesApi = getExpenses();

export const expensesQueryKey = ["expenses"] as const;

export function useExpensesQuery() {
  return useQuery({
    queryKey: expensesQueryKey,
    queryFn: () => expensesApi.listExpenses(),
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExpenseBody) => expensesApi.createExpense(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, body }: { expenseId: string; body: UpdateExpenseBody }) =>
      expensesApi.updateExpense(expenseId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function isSafeUserMessage(message: string): boolean {
  if (message.length > 160) return false;
  return !/prisma|invocation|E:\\|\/src\/|at\s+\S+\s+\(|node_modules/i.test(message);
}

export function getExpenseErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message?.trim();

  if (message && isSafeUserMessage(message)) {
    return message;
  }

  const status = axiosError.response?.status;
  if (status === 404) return "Expense not found.";
  if (status === 400) return "Please check your input and try again.";
  if (status === 401) return "Please sign in again.";

  return FALLBACK_ERROR;
}
