import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  authOperationIds,
  authTag,
  schemaRef,
} from "../auth.schemas.js";
import { registerUser } from "../services/register.service.js";
import type { SignAccessToken } from "../services/token.service.js";
import { getDeviceMeta, handleAuthError } from "../utils/route-helpers.js";

export function registerRoute(app: FastifyInstance, signToken: SignAccessToken) {
  app.post(
    "/register",
    {
      schema: {
        operationId: authOperationIds.register,
        tags: [authTag],
        description: "Create a new user account and issue access + refresh tokens",
        body: ref(schemaRef.registerBody),
        response: {
          201: ref(schemaRef.authResponse),
          409: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await registerUser(
          request.body as Parameters<typeof registerUser>[0],
          getDeviceMeta(request),
          signToken,
        );
        return reply.code(201).send(result);
      } catch (error) {
        return handleAuthError(error, reply);
      }
    },
  );
}
