import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { TransferOwnershipInput } from "../groups.types.js";
import { transferOwnership } from "../services/transfer-ownership.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function transferOwnershipRoute(app: FastifyInstance) {
  app.post(
    "/:groupId/transfer-ownership",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.transferOwnership,
        tags: [groupsTag],
        description: "Transfer group ownership to another member",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        body: ref(schemaRef.transferOwnershipBody),
        response: {
          200: {
            type: "object",
            properties: {
              members: {
                type: "array",
                items: { $ref: `${schemaRef.groupMember}#` },
              },
            },
          },
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
        const body = request.body as TransferOwnershipInput;
        const members = await transferOwnership(groupId, userId, body);
        return reply.send({ members });
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
