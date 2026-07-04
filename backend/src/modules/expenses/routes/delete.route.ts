import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  expensesOperationIds,
  expensesTag,
  schemaRef,
} from "../expenses.schemas.js";
import { deleteExpense } from "../services/delete.service.js";
import { handleExpenseError } from "../utils/route-helpers.js";

export function deleteExpenseRoute(app: FastifyInstance) {
  app.delete(
    "/:expenseId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: expensesOperationIds.deleteExpense,
        tags: [expensesTag],
        description: "Delete a personal expense",
        security: bearerAuthSecurity,
        params: ref(schemaRef.expenseIdParams),
        response: {
          204: { type: "null" },
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { expenseId } = request.params as { expenseId: string };
        await deleteExpense(userId, expenseId);
        return reply.code(204).send();
      } catch (error) {
        return handleExpenseError(error, reply);
      }
    },
  );
}
