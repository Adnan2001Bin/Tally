import { prisma } from "../../../lib/prisma.js";
import { toPublicGroupMember } from "../../../models/group.js";
import type { GroupMemberPublic } from "../../../models/group.js";
import type { UpdateMemberInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { getMemberBalance } from "./balance.service.js";
import {
  assertCanManageMember,
  requireMinRole,
} from "./permissions.service.js";

export async function updateMember(
  groupId: string,
  memberId: string,
  userId: string,
  input: UpdateMemberInput,
): Promise<GroupMemberPublic> {
  const actor = await requireMinRole(groupId, userId, "owner");

  const target = await prisma.groupMember.findFirst({
    where: { id: memberId, group_id: groupId },
    include: { user: { select: { username: true } } },
  });
  if (!target) {
    throw new GroupError("Member not found", 404, "MEMBER_NOT_FOUND");
  }

  assertCanManageMember(actor, target);

  if (input.role === "admin" && actor.role !== "owner") {
    throw new GroupError("Only the owner can promote admins", 403, "FORBIDDEN");
  }

  const updated = await prisma.groupMember.update({
    where: { id: target.id },
    data: { role: input.role },
    include: { user: { select: { username: true } } },
  });

  const balance = await getMemberBalance(groupId, updated.id);
  return toPublicGroupMember(updated, balance);
}
