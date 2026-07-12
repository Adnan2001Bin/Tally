import { EXPENSE_CATEGORIES } from "./ai.types.js";

export const aiTag = "AI";
export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

export const aiOperationIds = {
  parseExpense: "parseExpense",
} as const;

export const schemaRef = {
  parseExpenseBody: "ParseExpenseBody",
  parseExpenseResponse: "ParseExpenseResponse",
  parseExpenseUnavailable: "ParseExpenseUnavailable",
} as const;

export const parseExpenseBodySchema = {
  type: "object",
  required: ["text", "members"],
  additionalProperties: false,
  properties: {
    text: { type: "string", minLength: 1, maxLength: 2000 },
    members: {
      type: "array",
      minItems: 1,
      maxItems: 50,
      items: { type: "string", minLength: 1, maxLength: 100 },
    },
    currency_symbol: { type: "string", minLength: 1, maxLength: 8 },
  },
} as const;

export const parseExpensePayerSchema = {
  type: "object",
  required: ["name", "amount"],
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    amount: { type: "number" },
  },
} as const;

export const parseExpenseResponseSchema = {
  type: "object",
  required: [
    "description",
    "category",
    "total",
    "payers",
    "participants",
    "split_method",
    "split_values",
    "ambiguous_names",
  ],
  additionalProperties: false,
  properties: {
    description: { type: "string" },
    category: { type: "string", enum: [...EXPENSE_CATEGORIES] },
    total: { type: "number" },
    payers: {
      type: "array",
      items: parseExpensePayerSchema,
    },
    participants: {
      type: "array",
      items: { type: "string" },
    },
    split_method: { type: "string", enum: ["equal", "exact"] },
    split_values: {
      type: ["object", "null"],
      additionalProperties: { type: "number" },
    },
    ambiguous_names: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

export const parseExpenseUnavailableSchema = {
  type: "object",
  required: ["error", "message", "code", "fallback"],
  additionalProperties: false,
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    code: { type: "string" },
    fallback: { type: "boolean" },
  },
} as const;
