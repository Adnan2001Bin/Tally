import axios from "axios";
import { customInstance } from "./axios-instance";
import type { ParsedExpenseFacts } from "@/lib/tally/parse";

export interface ParseExpenseBody {
  text: string;
  members: string[];
  currency_symbol?: string;
}

export interface ParseExpenseUnavailable {
  error: string;
  message: string;
  code: string;
  fallback: boolean;
}

export function isParseFallbackError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  const data = error.response?.data as ParseExpenseUnavailable | undefined;
  return status === 503 || status === 504 || data?.fallback === true;
}

export async function parseExpenseText(body: ParseExpenseBody): Promise<ParsedExpenseFacts> {
  return customInstance<ParsedExpenseFacts>({
    url: "/ai/parse-expense",
    method: "POST",
    data: body,
  });
}
