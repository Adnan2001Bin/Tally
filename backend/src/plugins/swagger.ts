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
import {
  createExpenseBodySchema,
  expenseIdParamsSchema,
  expensePublicSchema,
  schemaRef as expensesSchemaRef,
  updateExpenseBodySchema,
} from "../modules/expenses/expenses.schemas.js";
import {
  schemaRef as usersSchemaRef,
  updateProfileBodySchema,
} from "../modules/users/users.schemas.js";
import {
  createGroupBodySchema,
  createGroupExpenseBodySchema,
  createGroupSettlementBodySchema,
  groupDetailPublicSchema,
  groupExpensePublicSchema,
  groupMemberPublicSchema,
  groupSettlementPublicSchema,
  groupSummaryPublicSchema,
  groupIdParamsSchema,
  groupExpenseParamsSchema,
  groupMemberParamsSchema,
  joinGroupBodySchema,
  joinRequestPublicSchema,
  joinRequestParamsSchema,
  respondJoinRequestBodySchema,
  schemaRef as groupsSchemaRef,
  transferOwnershipBodySchema,
  updateGroupBodySchema,
  updateMemberBodySchema,
} from "../modules/groups/groups.schemas.js";
import {
  parseExpenseBodySchema,
  parseExpenseResponseSchema,
  parseExpenseUnavailableSchema,
  schemaRef as aiSchemaRef,
} from "../modules/ai/ai.schemas.js";

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

const expensesListOpenApiSchema = {
  $id: expensesSchemaRef.expensesList,
  type: "object",
  properties: {
    expenses: {
      type: "array",
      items: { $ref: `${expensesSchemaRef.expense}#` },
    },
  },
} as const;

const expenseDetailOpenApiSchema = {
  $id: expensesSchemaRef.expenseDetail,
  type: "object",
  properties: {
    expense: { $ref: `${expensesSchemaRef.expense}#` },
  },
} as const;

const userDetailOpenApiSchema = {
  $id: usersSchemaRef.userDetail,
  type: "object",
  properties: {
    user: { $ref: "User#" },
  },
} as const;

const groupsListOpenApiSchema = {
  $id: groupsSchemaRef.groupsList,
  type: "object",
  properties: {
    groups: {
      type: "array",
      items: { $ref: `${groupsSchemaRef.groupSummary}#` },
    },
  },
} as const;

const joinRequestsListOpenApiSchema = {
  $id: groupsSchemaRef.joinRequestsList,
  type: "object",
  properties: {
    requests: {
      type: "array",
      items: { $ref: `${groupsSchemaRef.joinRequest}#` },
    },
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

  fastify.addSchema({
    $id: expensesSchemaRef.createExpenseBody,
    ...createExpenseBodySchema,
  });
  fastify.addSchema({
    $id: expensesSchemaRef.updateExpenseBody,
    ...updateExpenseBodySchema,
  });
  fastify.addSchema({ $id: expensesSchemaRef.expense, ...expensePublicSchema });
  fastify.addSchema({
    $id: expensesSchemaRef.expenseIdParams,
    ...expenseIdParamsSchema,
  });
  fastify.addSchema(expensesListOpenApiSchema);
  fastify.addSchema(expenseDetailOpenApiSchema);

  fastify.addSchema({
    $id: usersSchemaRef.updateProfileBody,
    ...updateProfileBodySchema,
  });
  fastify.addSchema(userDetailOpenApiSchema);

  fastify.addSchema({
    $id: groupsSchemaRef.createGroupBody,
    ...createGroupBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.updateGroupBody,
    ...updateGroupBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.joinGroupBody,
    ...joinGroupBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.respondJoinRequestBody,
    ...respondJoinRequestBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.updateMemberBody,
    ...updateMemberBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.transferOwnershipBody,
    ...transferOwnershipBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.createGroupExpenseBody,
    ...createGroupExpenseBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.createGroupSettlementBody,
    ...createGroupSettlementBodySchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupSummary,
    ...groupSummaryPublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupDetail,
    ...groupDetailPublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupMember,
    ...groupMemberPublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupExpense,
    ...groupExpensePublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupSettlement,
    ...groupSettlementPublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.joinRequest,
    ...joinRequestPublicSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupIdParams,
    ...groupIdParamsSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupExpenseParams,
    ...groupExpenseParamsSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.groupMemberParams,
    ...groupMemberParamsSchema,
  });
  fastify.addSchema({
    $id: groupsSchemaRef.joinRequestParams,
    ...joinRequestParamsSchema,
  });
  fastify.addSchema(groupsListOpenApiSchema);
  fastify.addSchema(joinRequestsListOpenApiSchema);

  fastify.addSchema({
    $id: aiSchemaRef.parseExpenseBody,
    ...parseExpenseBodySchema,
  });
  fastify.addSchema({
    $id: aiSchemaRef.parseExpenseResponse,
    ...parseExpenseResponseSchema,
  });
  fastify.addSchema({
    $id: aiSchemaRef.parseExpenseUnavailable,
    ...parseExpenseUnavailableSchema,
  });
  fastify.addSchema({
    $id: aiSchemaRef.parseStatus,
    type: "object",
    required: ["llm_available", "model"],
    additionalProperties: false,
    properties: {
      llm_available: { type: "boolean" },
      model: { type: "string" },
    },
  });

  await fastify.register(swagger, {
    refResolver: {
      buildLocalReference(json, _baseUri, _fragment, i) {
        return String(json.$id ?? json.title ?? `def-${i}`);
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
        {
          name: "Expenses",
          description: "Private personal ledger — amount, purpose, currency (default BDT)",
        },
        { name: "Users", description: "Profile and preferences" },
        {
          name: "Groups",
          description:
            "Shared expense groups — members, invite links, balances, expenses, settlements",
        },
        {
          name: "AI",
          description: "Natural-language parsing for expense capture (Cerebras LLM)",
        },
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
