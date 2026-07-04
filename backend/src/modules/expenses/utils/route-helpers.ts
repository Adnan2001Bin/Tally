import type { FastifyReply } from "fastify";
import { ExpenseError } from "../expenses.types.js";

export function handleExpenseError(error: unknown, reply: FastifyReply) {
  if (error instanceof ExpenseError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  }

  throw error;
}
