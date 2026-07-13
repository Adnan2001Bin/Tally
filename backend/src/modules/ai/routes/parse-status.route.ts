import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import { env } from "../../../config/env.js";
import {
  aiOperationIds,
  aiTag,
  bearerAuthSecurity,
  schemaRef,
} from "../ai.schemas.js";

export function parseStatusRoute(app: FastifyInstance) {
  app.get(
    "/status",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: aiOperationIds.parseStatus,
        tags: [aiTag],
        description: "Whether LLM expense parsing is configured on the server",
        security: bearerAuthSecurity,
        response: {
          200: ref(schemaRef.parseStatus),
        },
      },
    },
    async () => ({
      llm_available: !!env.cerebras.apiKey,
      model: env.cerebras.model,
    }),
  );
}
