import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  expensesOperationIds,
  expensesTag,
  schemaRef,
} from "../expenses.schemas.js";
import type { UpdateExpenseInput } from "../expenses.types.js";
import { updateExpense } from "../services/update.service.js";
import { handleExpenseError } from "../utils/route-helpers.js";

export function updateExpenseRoute(app: FastifyInstance) {
  app.patch(
    "/:expenseId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: expensesOperationIds.updateExpense,
        tags: [expensesTag],
        description: "Update a personal expense",
        security: bearerAuthSecurity,
        params: ref(schemaRef.expenseIdParams),
        body: ref(schemaRef.updateExpenseBody),
        response: {
          200: ref(schemaRef.expense),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { expenseId } = request.params as { expenseId: string };
        const body = request.body as UpdateExpenseInput;
        const expense = await updateExpense(userId, expenseId, body);
        return expense;
      } catch (error) {
        return handleExpenseError(error, reply);
      }
    },
  );
}
