import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import jwtPlugin from "./plugins/jwt.js";
import authenticatePlugin from "./plugins/authenticate.js";
import swaggerPlugin, { ref } from "./plugins/swagger.js";
import { registerRoutes } from "./routes/index.js";
import { schemaRef } from "./modules/auth/auth.schemas.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        error: "ValidationError",
        message: "Please check your input and try again.",
        code: "VALIDATION_ERROR",
      });
    }

    const statusCode =
      typeof error.statusCode === "number" && error.statusCode >= 400
        ? error.statusCode
        : 500;

    // Never leak stack traces, Prisma internals, or file paths to clients.
    const isClientError = statusCode >= 400 && statusCode < 500;
    const message = isClientError
      ? error.message
      : "Something went wrong. Please try again.";

    return reply.code(statusCode).send({
      error: isClientError ? error.name || "Error" : "InternalServerError",
      message,
      code: isClientError
        ? (typeof error.code === "string" ? error.code : "ERROR")
        : "INTERNAL_ERROR",
    });
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(swaggerPlugin);
  await app.register(jwtPlugin);
  await app.register(authenticatePlugin);
  await registerRoutes(app);

  app.get(
    "/health",
    {
      schema: {
        operationId: "health",
        tags: ["Health"],
        description: "Check that the API is running",
        response: {
          200: ref(schemaRef.health),
        },
      },
    },
    async () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );

  return app;
}
