import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { SessionDeviceMeta } from "../../../models/auth-session.js";
import { AuthError } from "../auth.types.js";

export function getDeviceMeta(request: FastifyRequest): SessionDeviceMeta {
  return {
    device_name: null,
    ip_address: request.ip,
    user_agent: request.headers["user-agent"] ?? null,
  };
}

export function signAccessToken(app: FastifyInstance) {
  return (payload: { sub: string; sid: string }) => app.jwt.sign(payload);
}

export function handleAuthError(error: unknown, reply: FastifyReply) {
  if (error instanceof AuthError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  }

  throw error;
}
