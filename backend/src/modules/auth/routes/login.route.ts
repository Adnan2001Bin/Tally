import type { FastifyInstance } from "fastify";
import { authResponseSchema, authTag, errorResponseSchema, loginBodySchema } from "../auth.schemas.js";
import { loginUser } from "../services/login.service.js";
import type { SignAccessToken } from "../services/token.service.js";
import { getDeviceMeta, handleAuthError } from "../utils/route-helpers.js";

export function loginRoute(app: FastifyInstance, signToken: SignAccessToken) {
  app.post(
    "/login",
    {
      schema: {
        tags: [authTag],
        description: "Authenticate with email and password",
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await loginUser(
          request.body as Parameters<typeof loginUser>[0],
          getDeviceMeta(request),
          signToken,
        );
        return result;
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );
}
