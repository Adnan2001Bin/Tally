import type {
  CreateExpenseBody,
  Expense,
  ExpenseDetail,
  ExpensesList,
  UpdateExpenseBody,
} from "../../models/expenses/expense";
import { customInstance } from "../../axios-instance";

export const getExpenses = () => {
  const createExpense = (body: CreateExpenseBody) =>
    customInstance<Expense>({
      url: "/expenses",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const listExpenses = () =>
    customInstance<ExpensesList>({
      url: "/expenses",
      method: "GET",
    });

  const getExpense = (expenseId: string) =>
    customInstance<ExpenseDetail>({
      url: `/expenses/${expenseId}`,
      method: "GET",
    });

  const updateExpense = (expenseId: string, body: UpdateExpenseBody) =>
    customInstance<Expense>({
      url: `/expenses/${expenseId}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const deleteExpense = (expenseId: string) =>
    customInstance<void>({
      url: `/expenses/${expenseId}`,
      method: "DELETE",
    });

  return {
    createExpense,
    listExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
  };
};

export type CreateExpenseResult = Awaited<ReturnType<ReturnType<typeof getExpenses>["createExpense"]>>;
export type ListExpensesResult = Awaited<ReturnType<ReturnType<typeof getExpenses>["listExpenses"]>>;
