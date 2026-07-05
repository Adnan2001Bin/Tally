import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { leaveGroup } from "../services/remove-member.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function leaveGroupRoute(app: FastifyInstance) {
  app.post(
    "/:groupId/leave",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.leaveGroup,
        tags: [groupsTag],
        description: "Leave a group. Blocked if you have an outstanding balance.",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        response: {
          204: { type: "null", description: "Left group" },
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          409: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId } = request.params as { groupId: string };
        await leaveGroup(groupId, userId);
        return reply.code(204).send();
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
