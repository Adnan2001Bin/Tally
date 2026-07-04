import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  expensesOperationIds,
  expensesTag,
  schemaRef,
} from "../expenses.schemas.js";
import { listExpenses } from "../services/list.service.js";
import { handleExpenseError } from "../utils/route-helpers.js";

export function listExpensesRoute(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: expensesOperationIds.listExpenses,
        tags: [expensesTag],
        description: "List personal expenses for the authenticated user",
        security: bearerAuthSecurity,
        response: {
          200: ref(schemaRef.expensesList),
          401: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const expenses = await listExpenses(userId);
        return { expenses };
      } catch (error) {
        return handleExpenseError(error, reply);
      }
    },
  );
}
