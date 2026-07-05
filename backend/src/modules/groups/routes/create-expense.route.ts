import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { CreateGroupExpenseInput } from "../groups.types.js";
import { createGroupExpense } from "../services/create-group-expense.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function createGroupExpenseRoute(app: FastifyInstance) {
  app.post(
    "/:groupId/expenses",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.createGroupExpense,
        tags: [groupsTag],
        description:
          "Add a shared expense. Each member's share is bridged to their personal ledger.",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        body: ref(schemaRef.createGroupExpenseBody),
        response: {
          201: ref(schemaRef.groupExpense),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId } = request.params as { groupId: string };
        const body = request.body as CreateGroupExpenseInput;
        const expense = await createGroupExpense(groupId, userId, body);
        return reply.code(201).send(expense);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
