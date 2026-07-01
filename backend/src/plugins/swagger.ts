import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "../config/env.js";

export default fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Tally API",
        description:
          "Personal and shared expense tracker API — auth, ledgers, groups, and more.",
        version: "0.1.0",
      },
      servers: [
        {
          url: `http://localhost:${env.port}`,
          description: "Local development",
        },
      ],
      tags: [
        { name: "Health", description: "Service health checks" },
        { name: "Auth", description: "Registration, login, tokens, and sessions" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token from register, login, or refresh",
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
  });
});
