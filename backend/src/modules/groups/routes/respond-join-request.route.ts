import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { RespondJoinRequestInput } from "../groups.types.js";
import { respondJoinRequest } from "../services/respond-join-request.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function respondJoinRequestRoute(app: FastifyInstance) {
  app.post(
    "/:groupId/requests/:requestId",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.respondJoinRequest,
        tags: [groupsTag],
        description: "Accept or reject a join request (admin+)",
        security: bearerAuthSecurity,
        params: ref(schemaRef.joinRequestParams),
        body: ref(schemaRef.respondJoinRequestBody),
        response: {
          200: ref(schemaRef.joinRequest),
          401: ref(schemaRef.apiError),
          403: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const { groupId, requestId } = request.params as {
          groupId: string;
          requestId: string;
        };
        const body = request.body as RespondJoinRequestInput;
        const result = await respondJoinRequest(groupId, requestId, userId, body);
        return reply.send(result);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
