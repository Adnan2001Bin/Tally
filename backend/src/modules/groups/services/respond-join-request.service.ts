import { prisma } from "../../../lib/prisma.js";
import { toPublicJoinRequest } from "../../../models/group.js";
import type { JoinRequestPublic } from "../../../models/group.js";
import type { RespondJoinRequestInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { requireMinRole } from "./permissions.service.js";

export async function respondJoinRequest(
  groupId: string,
  requestId: string,
  userId: string,
  input: RespondJoinRequestInput,
): Promise<JoinRequestPublic> {
  await requireMinRole(groupId, userId, "admin");

  const request = await prisma.groupJoinRequest.findFirst({
    where: { id: requestId, group_id: groupId, status: "pending" },
    include: { user: { select: { username: true, display_name: true } } },
  });
  if (!request) {
    throw new GroupError("Join request not found", 404, "REQUEST_NOT_FOUND");
  }

  if (input.action === "reject") {
    const updated = await prisma.groupJoinRequest.update({
      where: { id: request.id },
      data: { status: "rejected" },
      include: { user: { select: { username: true, display_name: true } } },
    });
    return toPublicJoinRequest(updated);
  }

  const existingMember = await prisma.groupMember.findFirst({
    where: { group_id: groupId, user_id: request.user_id },
  });
  if (existingMember) {
    const updated = await prisma.groupJoinRequest.update({
      where: { id: request.id },
      data: { status: "accepted" },
      include: { user: { select: { username: true, display_name: true } } },
    });
    return toPublicJoinRequest(updated);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.groupMember.create({
      data: {
        group_id: groupId,
        user_id: request.user_id,
        role: "member",
      },
    });
    return tx.groupJoinRequest.update({
      where: { id: request.id },
      data: { status: "accepted" },
      include: { user: { select: { username: true, display_name: true } } },
    });
  });

  return toPublicJoinRequest(updated);
}
