import { prisma } from "../../../lib/prisma.js";
import { toPublicJoinRequest } from "../../../models/group.js";
import type { JoinRequestPublic } from "../../../models/group.js";
import { GroupError } from "../groups.types.js";
import { requireMinRole } from "./permissions.service.js";

export async function listJoinRequests(
  groupId: string,
  userId: string,
): Promise<JoinRequestPublic[]> {
  await requireMinRole(groupId, userId, "admin");

  const requests = await prisma.groupJoinRequest.findMany({
    where: { group_id: groupId, status: "pending" },
    include: { user: { select: { username: true, display_name: true } } },
    orderBy: { created_at: "asc" },
  });

  return requests.map(toPublicJoinRequest);
}
