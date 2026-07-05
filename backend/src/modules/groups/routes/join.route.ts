import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { JoinGroupInput } from "../groups.types.js";
import { joinGroup } from "../services/join-group.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function joinGroupRoute(app: FastifyInstance) {
  app.post(
    "/join",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.joinGroup,
        tags: [groupsTag],
        description: "Request to join a group via invite code (admin approval required)",
        security: bearerAuthSecurity,
        body: ref(schemaRef.joinGroupBody),
        response: {
          201: ref(schemaRef.joinRequest),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
          404: ref(schemaRef.apiError),
          409: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const body = request.body as JoinGroupInput;
        const joinRequest = await joinGroup(userId, body);
        return reply.code(201).send(joinRequest);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
