import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { CreateGroupExpenseInput } from "../groups.types.js";
import { updateGroupExpense } from "../services/update-group-expense.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function updateGroupExpenseRoute(app: FastifyInstance) {
  app.patch(
    "/:groupId/expenses/:expenseId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.updateGroupExpense,
        tags: [groupsTag],
        description: "Update a shared expense (creator only)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupExpenseParams),
        body: ref(schemaRef.createGroupExpenseBody),
        response: {
          200: ref(schemaRef.groupExpense),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId, expenseId } = request.params as {
          groupId: string;
          expenseId: string;
        };
        const body = request.body as CreateGroupExpenseInput;
        const expense = await updateGroupExpense(groupId, expenseId, userId, body);
        return reply.send(expense);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
