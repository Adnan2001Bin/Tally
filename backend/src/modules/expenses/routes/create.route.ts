import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  expensesOperationIds,
  expensesTag,
  schemaRef,
} from "../expenses.schemas.js";
import type { CreateExpenseInput } from "../expenses.types.js";
import { createExpense } from "../services/create.service.js";
import { handleExpenseError } from "../utils/route-helpers.js";

export function createExpenseRoute(app: FastifyInstance) {
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: expensesOperationIds.createExpense,
        tags: [expensesTag],
        description: "Record a personal expense (amount and what it was for)",
        security: bearerAuthSecurity,
        body: ref(schemaRef.createExpenseBody),
        response: {
          201: ref(schemaRef.expense),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const body = request.body as CreateExpenseInput;
        const expense = await createExpense(userId, body);
        return reply.code(201).send(expense);
      } catch (error) {
        return handleExpenseError(error, reply);
      }
    },
  );
}
