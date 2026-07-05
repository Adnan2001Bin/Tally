import type { FastifyInstance } from "fastify";
import { ref } from "../../../plugins/swagger.js";
import {
  bearerAuthSecurity,
  groupsOperationIds,
  groupsTag,
  schemaRef,
} from "../groups.schemas.js";
import type { CreateGroupSettlementInput } from "../groups.types.js";
import { createGroupSettlement } from "../services/create-settlement.service.js";
import { handleGroupError } from "../utils/route-helpers.js";

export function createGroupSettlementRoute(app: FastifyInstance) {
  app.post(
    "/:groupId/settlements",
    {
      preHandler: [app.authenticate],
      schema: {
        operationId: groupsOperationIds.createGroupSettlement,
        tags: [groupsTag],
        description: "Record a settle-up payment between members",
        security: bearerAuthSecurity,
        params: ref(schemaRef.groupIdParams),
        body: ref(schemaRef.createGroupSettlementBody),
        response: {
          201: ref(schemaRef.groupSettlement),
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
        const body = request.body as CreateGroupSettlementInput;
        const settlement = await createGroupSettlement(groupId, userId, body);
        return reply.code(201).send(settlement);
      } catch (error) {
        return handleGroupError(error, reply);
      }
    },
  );
}
