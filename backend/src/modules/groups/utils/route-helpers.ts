import type { FastifyReply } from "fastify";
import { GroupError } from "../groups.types.js";

export function handleGroupError(error: unknown, reply: FastifyReply) {
  if (error instanceof GroupError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  }

  throw error;
}
