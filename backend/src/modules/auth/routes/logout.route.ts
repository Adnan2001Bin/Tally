import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import { authOperationIds, authTag, schemaRef } from "../auth.schemas.js";
import { logoutByRefreshToken } from "../services/logout.service.js";

export function logoutRoute(app: FastifyInstance) {
  app.post(
    "/logout",
    {
      schema: {
        operationId: authOperationIds.logout,
        tags: [authTag],
        description: "Revoke the session tied to the given refresh token",
        body: ref(schemaRef.logoutBody),
        response: {
          204: { type: "null" },
        },
      },
    },
    async (request, reply) => {
      const { refresh_token } = request.body as { refresh_token: string };
      await logoutByRefreshToken(refresh_token);
      return reply.code(204).send();
    },
  );
}
