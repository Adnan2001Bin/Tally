import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { UpdateMemberInput } from "../groups.types.js";
import { updateMember } from "../services/update-member.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function updateMemberRoute(app: FastifyInstance) {
  app.patch(
    "/:groupId/members/:memberId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.updateMember,
        tags: [groupsTag],
        description: "Promote or demote a member (owner for admin, admin+ for member)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupMemberParams),
        body: ref(schemaRef.updateMemberBody),
        response: {
          200: ref(schemaRef.groupMember),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
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
        const body = request.body as UpdateMemberInput;
        const member = await updateMember(groupId, memberId, userId, body);
        return reply.send(member);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
