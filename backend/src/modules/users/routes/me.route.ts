import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  schemaRef,
  usersOperationIds,
  usersTag,
} from "../users.schemas.js";
import type { UpdateProfileInput } from "../users.types.js";
import { getMe, updateMe } from "../services/profile.service.js";
import { handleUserError } from "../utils/route-helpers.js";

export function meRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: usersOperationIds.getMe,
        tags: [usersTag],
        description: "Get the authenticated user's profile",
        security: bearerAuthSecurity,
        response: {
          200: ref(schemaRef.userDetail),
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const user = await getMe(userId);
        return { user };
      } catch (error) {
        return handleUserError(error, reply);
      }
    },
  );

  app.patch(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: usersOperationIds.updateMe,
        tags: [usersTag],
        description: "Update profile preferences (e.g. monthly budget)",
        security: bearerAuthSecurity,
        body: ref(schemaRef.updateProfileBody),
        response: {
          200: ref(schemaRef.userDetail),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const body = request.body as UpdateProfileInput;
        const user = await updateMe(userId, body);
        return { user };
      } catch (error) {
        return handleUserError(error, reply);
      }
    },
  );
}
