import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { CreateGroupInput } from "../groups.types.js";
import { createGroup } from "../services/create-group.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function createGroupRoute(app: FastifyInstance) {
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.createGroup,
        tags: [groupsTag],
        description: "Create a shared expense group. Creator becomes owner.",
        security: bearerAuthSecurity,
        body: ref(schemaRef.createGroupBody),
        response: {
          201: ref(schemaRef.groupSummary),
          400: ref(schemaRef.apiError),
          401: ref(schemaRef.apiError),
        },
      },
    },
    async (request, reply) => {
      try {
        const { sub: userId } = request.user;
        const body = request.body as CreateGroupInput;
        const group = await createGroup(userId, body);
        return reply.code(201).send(group);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
