import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  authOperationIds,
  authTag,
  schemaRef,
} from "../auth.schemas.js";
import { loginUser } from "../services/login.service.js";
import type { SignAccessToken } from "../services/token.service.js";
import { getDeviceMeta, handleAuthError } from "../utils/route-helpers.js";

export function loginRoute(app: FastifyInstance, signToken: SignAccessToken) {
  app.post(
    "/login",
    {
      schema: {
        operationId: authOperationIds.login,
        tags: [authTag],
        description: "Authenticate with email and password",
        body: ref(schemaRef.loginBody),
        response: {
          200: ref(schemaRef.authResponse),
          401: ref(schemaRef.apiError),
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
