import type { FastifyInstance } from "fastify";
import { createGroupRoute } from "./create.route.js";
import { createGroupExpenseRoute } from "./create-expense.route.js";
import { createGroupSettlementRoute } from "./create-settlement.route.js";
import { deleteGroupRoute } from "./delete.route.js";
import { getGroupRoute } from "./get.route.js";
import { joinGroupRoute } from "./join.route.js";
import { leaveGroupRoute } from "./leave.route.js";
import { listGroupsRoute } from "./list.route.js";
import { listJoinRequestsRoute } from "./list-join-requests.route.js";
import { removeMemberRoute } from "./remove-member.route.js";
import { respondJoinRequestRoute } from "./respond-join-request.route.js";
import { transferOwnershipRoute } from "./transfer-ownership.route.js";
import { updateGroupRoute } from "./update.route.js";
import { updateMemberRoute } from "./update-member.route.js";

export async function groupsRoutes(app: FastifyInstance) {
  createGroupRoute(app);
  listGroupsRoute(app);
  joinGroupRoute(app);
  getGroupRoute(app);
  updateGroupRoute(app);
  deleteGroupRoute(app);
  listJoinRequestsRoute(app);
  respondJoinRequestRoute(app);
  updateMemberRoute(app);
  removeMemberRoute(app);
  leaveGroupRoute(app);
  transferOwnershipRoute(app);
  createGroupExpenseRoute(app);
  createGroupSettlementRoute(app);
}
