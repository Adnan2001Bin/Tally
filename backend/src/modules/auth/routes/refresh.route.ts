import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  authOperationIds,
  authTag,
  schemaRef,
} from "../auth.schemas.js";
import { refreshTokens } from "../services/refresh.service.js";
import type { SignAccessToken } from "../services/token.service.js";
import { handleAuthError } from "../utils/route-helpers.js";

export function refreshRoute(app: FastifyInstance, signToken: SignAccessToken) {
  app.post(
    "/refresh",
    {
      schema: {
        operationId: authOperationIds.refresh,
        tags: [authTag],
        description: "Rotate refresh token and issue a new access token",
        body: ref(schemaRef.refreshBody),
        response: {
          200: ref(schemaRef.authResponse),
          401: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { refresh_token } = request.body as { refresh_token: string };
        return await refreshTokens(refresh_token, signToken);
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );
}
