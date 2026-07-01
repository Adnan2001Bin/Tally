import type { FastifyInstance } from "fastify";
import { authResponseSchema, errorResponseSchema, refreshBodySchema } from "../auth.schemas.js";
import { refreshTokens } from "../services/refresh.service.js";
import type { SignAccessToken } from "../services/token.service.js";
import { handleAuthError } from "../utils/route-helpers.js";

export function refreshRoute(app: FastifyInstance, signToken: SignAccessToken) {
  app.post(
    "/refresh",
    {
      schema: {
        body: refreshBodySchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
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
