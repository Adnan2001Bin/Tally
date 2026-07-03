import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "../config/env.js";
import {
  authResponseSchema,
  errorResponseSchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  revokeAllQuerySchema,
  schemaRef,
  sessionIdParamsSchema,
  sessionPublicSchema,
  userPublicSchema,
} from "../modules/auth/auth.schemas.js";

const sessionsListSchema = {
  $id: schemaRef.sessionsList,
  type: "object",
  properties: {
    sessions: {
      type: "array",
      items: { $ref: `${schemaRef.session}#` },
    },
  },
} as const;

const sessionDetailSchema = {
  $id: schemaRef.sessionDetail,
  type: "object",
  properties: {
    session: { $ref: `${schemaRef.session}#` },
  },
} as const;

const revokeAllSessionsResponseSchema = {
  $id: schemaRef.revokeAllSessions,
  type: "object",
  properties: {
    revoked_count: { type: "number" },
  },
} as const;

const healthResponseSchema = {
  $id: schemaRef.health,
  type: "object",
  properties: {
    status: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
  },
} as const;

function ref(id: string) {
  return { $ref: `${id}#` };
}

export default fp(async (fastify) => {
  fastify.addSchema({ $id: schemaRef.registerBody, ...registerBodySchema });
  fastify.addSchema({ $id: schemaRef.loginBody, ...loginBodySchema });
  fastify.addSchema({ $id: schemaRef.refreshBody, ...refreshBodySchema });
  fastify.addSchema({ $id: schemaRef.logoutBody, ...logoutBodySchema });
  fastify.addSchema({ $id: schemaRef.authResponse, ...authResponseSchema });
  fastify.addSchema({ $id: schemaRef.apiError, ...errorResponseSchema });
  fastify.addSchema({ $id: schemaRef.session, ...sessionPublicSchema });
  fastify.addSchema({ $id: schemaRef.sessionIdParams, ...sessionIdParamsSchema });
  fastify.addSchema({ $id: schemaRef.revokeAllParams, ...revokeAllQuerySchema });
  fastify.addSchema({ $id: "User", ...userPublicSchema });
  fastify.addSchema(sessionsListSchema);
  fastify.addSchema(sessionDetailSchema);
  fastify.addSchema(revokeAllSessionsResponseSchema);
  fastify.addSchema(healthResponseSchema);

  await fastify.register(swagger, {
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, i) {
        return json.$id || json.title || `def-${i}`;
      },
    },
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

export { ref };
