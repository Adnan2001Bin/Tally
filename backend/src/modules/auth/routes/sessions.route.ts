import type { FastifyInstance } from "fastify";
import {
  authTag,
  bearerAuthSecurity,
  errorResponseSchema,
  revokeAllQuerySchema,
  sessionIdParamsSchema,
  sessionPublicSchema,
} from "../auth.schemas.js";
import {
  assertActiveSessionForUser,
  getUserSession,
  listUserSessions,
  revokeAllUserSessions,
  revokeUserSession,
} from "../services/session.service.js";
import { handleAuthError } from "../utils/route-helpers.js";

export function sessionsRoutes(app: FastifyInstance) {
  app.get(
    "/sessions",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: [authTag],
        description: "List all active sessions for the authenticated user",
        security: bearerAuthSecurity,
        response: {
          200: {
            type: "object",
            properties: {
              sessions: {
                type: "array",
                items: sessionPublicSchema,
              },
            },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId, sid: sessionId } = request.user;
        await assertActiveSessionForUser(userId, sessionId);

        const sessions = await listUserSessions(userId);
        return { sessions };
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );

  app.get(
    "/sessions/:sessionId",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: [authTag],
        description: "Get a single session by id",
        security: bearerAuthSecurity,
        params: sessionIdParamsSchema,
        response: {
          200: {
            type: "object",
            properties: {
              session: sessionPublicSchema,
            },
          },
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId, sid: sessionId } = request.user;
        await assertActiveSessionForUser(userId, sessionId);

        const { sessionId: targetSessionId } = request.params as { sessionId: string };
        const session = await getUserSession(userId, targetSessionId);
        return { session };
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );

  app.delete(
    "/sessions",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: [authTag],
        description: "Revoke all sessions; keep_current defaults to true",
        security: bearerAuthSecurity,
        querystring: revokeAllQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              revoked_count: { type: "number" },
            },
          },
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId, sid: sessionId } = request.user;
        await assertActiveSessionForUser(userId, sessionId);

        const { keep_current = true } = request.query as { keep_current?: boolean };
        const revokedCount = await revokeAllUserSessions(
          userId,
          keep_current ? sessionId : undefined,
        );

        return { revoked_count: revokedCount };
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );

  app.delete(
    "/sessions/:sessionId",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: [authTag],
        description: "Revoke a specific session by id",
        security: bearerAuthSecurity,
        params: sessionIdParamsSchema,
        response: {
          204: { type: "null" },
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId, sid: sessionId } = request.user;
        await assertActiveSessionForUser(userId, sessionId);

        const { sessionId: targetSessionId } = request.params as { sessionId: string };
        await revokeUserSession(userId, targetSessionId);
        return reply.code(204).send();
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );
}
