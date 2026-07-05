import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { deleteGroup } from "../services/delete-group.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function deleteGroupRoute(app: FastifyInstance) {
  app.delete(
    "/:groupId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.deleteGroup,
        tags: [groupsTag],
        description: "Delete a group (owner only)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        response: {
          204: { type: "null", description: "Group deleted" },
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId } = request.params as { groupId: string };
        await deleteGroup(groupId, userId);
        return reply.code(204).send();
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
