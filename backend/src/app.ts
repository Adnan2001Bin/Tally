import Fastify from "fastify";
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
