import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import { listJoinRequests } from "../services/list-join-requests.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function listJoinRequestsRoute(app: FastifyInstance) {
  app.get(
    "/:groupId/requests",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.listJoinRequests,
        tags: [groupsTag],
        description: "List pending join requests (admin+)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        response: {
          200: ref(schemaRef.joinRequestsList),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId } = request.params as { groupId: string };
        const requests = await listJoinRequests(groupId, userId);
        return reply.send({ requests });
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
