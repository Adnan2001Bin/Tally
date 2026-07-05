import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { listGroups } from "../services/list-groups.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function listGroupsRoute(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.listGroups,
        tags: [groupsTag],
        description: "List groups the current user belongs to",
        security: bearerAuthSecurity,
        response: {
          200: ref(schemaRef.groupsList),
          401: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const groups = await listGroups(userId);
        return reply.send({ groups });
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
