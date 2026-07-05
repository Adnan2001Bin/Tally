import { prisma } from "../../../lib/prisma.js";
import { toPublicJoinRequest } from "../../../models/group.js";
import type { JoinRequestPublic } from "../../../models/group.js";
import type { JoinGroupInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";

export async function joinGroup(
  userId: string,
  input: JoinGroupInput,
): Promise<JoinRequestPublic> {
  const inviteCode = input.invite_code.trim().toUpperCase();

  const group = await prisma.group.findUnique({
    where: { invite_code: inviteCode },
  });
  if (!group) {
    throw new GroupError("Invalid invite code", 404, "INVALID_INVITE");
  }

  const existingMember = await prisma.groupMember.findFirst({
    where: { group_id: group.id, user_id: userId },
  });
  if (existingMember) {
    throw new GroupError("You are already a member of this group", 409, "ALREADY_MEMBER");
  }

  const pending = await prisma.groupJoinRequest.findFirst({
    where: { group_id: group.id, user_id: userId, status: "pending" },
    include: { user: { select: { username: true, display_name: true } } },
  });
  if (pending) {
    return toPublicJoinRequest(pending);
  }

  const request = await prisma.groupJoinRequest.create({
    data: {
      group_id: group.id,
      user_id: userId,
      status: "pending",
    },
    include: { user: { select: { username: true, display_name: true } } },
  });

  return toPublicJoinRequest(request);
}
