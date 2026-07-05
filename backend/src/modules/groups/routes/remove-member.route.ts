import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { removeMember } from "../services/remove-member.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function removeMemberRoute(app: FastifyInstance) {
  app.delete(
    "/:groupId/members/:memberId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.removeMember,
        tags: [groupsTag],
        description: "Remove a member (admin+). Blocked if they have an outstanding balance.",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupMemberParams),
        response: {
          204: { type: "null", description: "Member removed" },
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
          409: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId, memberId } = request.params as {
          groupId: string;
          memberId: string;
        };
        await removeMember(groupId, memberId, userId);
        return reply.code(204).send();
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
