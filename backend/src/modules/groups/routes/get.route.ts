import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { getGroup } from "../services/get-group.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function getGroupRoute(app: FastifyInstance) {
  app.get(
    "/:groupId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.getGroup,
        tags: [groupsTag],
        description: "Group dashboard — members, expenses, balances",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        response: {
          200: ref(schemaRef.groupDetail),
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
        const group = await getGroup(groupId, userId);
        return reply.send(group);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
