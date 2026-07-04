import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  expensesOperationIds,
  expensesTag,
  schemaRef,
} from "../expenses.schemas.js";
import { getExpense } from "../services/get.service.js";
import { handleExpenseError } from "../utils/route-helpers.js";

export function getExpenseRoute(app: FastifyInstance) {
  app.get(
    "/:expenseId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: expensesOperationIds.getExpense,
        tags: [expensesTag],
        description: "Get a single personal expense by id",
        security: bearerAuthSecurity,
        params: ref(schemaRef.expenseIdParams),
        response: {
          200: ref(schemaRef.expenseDetail),
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { expenseId } = request.params as { expenseId: string };
        const expense = await getExpense(userId, expenseId);
        return { expense };
      } catch (error) {
        return handleExpenseError(error, reply);
      }
    },
  );
}
