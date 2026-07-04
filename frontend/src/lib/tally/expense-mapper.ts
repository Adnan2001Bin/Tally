import type { Expense } from "@/lib/api/models/expenses/expense";
import type { Entry } from "./types";

function formatWhen(iso: string): { when: string; time: string } {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let when: string;
  if (startOfDate.getTime() === startOfToday.getTime()) when = "Today";
  else if (startOfDate.getTime() === startOfYesterday.getTime()) when = "Yesterday";
  else when = "Earlier";

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { when, time };
}

/** Map API expense → UI entry (personal ledger row). */
export function apiExpenseToEntry(expense: Expense): Entry {
  const { when, time } = formatWhen(expense.created_at);
  return {
    id: expense.id,
    when,
    time,
    title: expense.description,
    sub: "Personal",
    cat: "other",
    amount: expense.amount,
    kind: "personal",
    at: expense.created_at,
    note: expense.currency !== "BDT" ? expense.currency : undefined,
  };
}

export function entryToCreateBody(input: { amount: number; description: string }) {
  return {
    amount: input.amount,
    description: input.description.trim() || "Expense",
  };
}
