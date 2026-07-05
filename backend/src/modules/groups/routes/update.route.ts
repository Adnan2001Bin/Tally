import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { UpdateGroupInput } from "../groups.types.js";
import { updateGroup } from "../services/update-group.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function updateGroupRoute(app: FastifyInstance) {
  app.patch(
    "/:groupId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.updateGroup,
        tags: [groupsTag],
        description: "Update group name, description, or type (admin+)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        body: ref(schemaRef.updateGroupBody),
        response: {
          200: ref(schemaRef.groupSummary),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId } = request.params as { groupId: string };
        const body = request.body as UpdateGroupInput;
        const group = await updateGroup(groupId, userId, body);
        return reply.send(group);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
