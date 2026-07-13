import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import { env } from "../../../config/env.js";
import {
  aiOperationIds,
  aiTag,
  bearerAuthSecurity,
  schemaRef,
} from "../ai.schemas.js";
import type { ParseExpenseRequest } from "../ai.types.js";
import {
  parseExpenseText,
  ParseExpenseUnavailableError,
} from "../services/parse-expense.service.js";

export function parseExpenseRoute(app: FastifyInstance) {
  app.post(
    "/parse-expense",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: aiOperationIds.parseExpense,
        tags: [aiTag],
        description:
          "Parse natural-language expense text into structured facts using Cerebras LLM. Math and splits are computed client-side.",
        security: bearerAuthSecurity,
        body: ref(schemaRef.parseExpenseBody),
        response: {
          200: ref(schemaRef.parseExpenseResponse),
          400: ref("ApiError"),
          401: ref("ApiError"),
          503: ref(schemaRef.parseExpenseUnavailable),
          504: ref(schemaRef.parseExpenseUnavailable),
        },
      },
    },
    async (request, reply) => {
      const log = request.log;
      const body = request.body as ParseExpenseRequest;
      log.info(
        {
          userId: request.user?.sub,
          textLength: body.text?.length ?? 0,
          memberCount: body.members?.length ?? 0,
        },
        "[ai] POST /parse-expense",
      );
      try {
        const result = await parseExpenseText(body, log);
        return reply.send(result);
      } catch (error) {
        if (error instanceof ParseExpenseUnavailableError) {
          log.error(
            {
              message: error.message,
              detail: error.detail,
              model: env.cerebras.model,
            },
            "[ai] POST /parse-expense → 503",
          );
          return reply.code(error.statusCode).send({
            error: "ServiceUnavailable",
            message: error.message,
            code: error.code,
            fallback: error.fallback,
            ...(env.isProduction ? {} : { detail: error.detail }),
          });
        }
        log.error({ err: error }, "[ai] POST /parse-expense → unexpected error");
        throw error;
      }
    },
  );
}
