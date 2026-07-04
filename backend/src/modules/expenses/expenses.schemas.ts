export const expensesTag = "Expenses";
export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

/** Short OpenAPI operationIds — Orval uses these for function/type names. */
export const expensesOperationIds = {
  createExpense: "createExpense",
  listExpenses: "listExpenses",
  getExpense: "getExpense",
  updateExpense: "updateExpense",
  deleteExpense: "deleteExpense",
} as const;

export const schemaRef = {
  createExpenseBody: "CreateExpenseBody",
  updateExpenseBody: "UpdateExpenseBody",
  expense: "Expense",
  expenseDetail: "ExpenseDetail",
  expensesList: "ExpensesList",
  expenseIdParams: "ExpenseIdParams",
  apiError: "ApiError",
} as const;

/** ISO 4217 currency codes; personal expenses default to BDT (tk). */
export const currencyPattern = "^[A-Z]{3}$";

export const createExpenseBodySchema = {
  type: "object",
  required: ["amount", "description"],
  additionalProperties: false,
  properties: {
    amount: { type: "number", exclusiveMinimum: 0, maximum: 999_999_999_999.99 },
    description: { type: "string", minLength: 1, maxLength: 500 },
    currency: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      pattern: currencyPattern,
      default: "BDT",
    },
  },
} as const;

export const updateExpenseBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    amount: { type: "number", exclusiveMinimum: 0, maximum: 999_999_999_999.99 },
    description: { type: "string", minLength: 1, maxLength: 500 },
    currency: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      pattern: currencyPattern,
    },
  },
} as const;

export const expenseIdParamsSchema = {
  type: "object",
  required: ["expenseId"],
  properties: {
    expenseId: { type: "string", format: "uuid" },
  },
} as const;

export const expensePublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    amount: { type: "number" },
    description: { type: "string" },
    currency: { type: "string" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
} as const;
