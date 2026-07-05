import type { FastifyReply } from "fastify";
import { UserError } from "../users.types.js";

export function handleUserError(error: unknown, reply: FastifyReply) {
  if (error instanceof UserError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  }

  throw error;
}
