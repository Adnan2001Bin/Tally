import { prisma } from "../../../lib/prisma.js";
import { toPublicGroupMember } from "../../../models/group.js";
import type { GroupMemberPublic } from "../../../models/group.js";
import type { TransferOwnershipInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { getMemberBalance } from "./balance.service.js";
import { requireMinRole } from "./permissions.service.js";

export async function transferOwnership(
  groupId: string,
  userId: string,
  input: TransferOwnershipInput,
): Promise<GroupMemberPublic[]> {
  const currentOwner = await requireMinRole(groupId, userId, "owner");

  const newOwner = await prisma.groupMember.findFirst({
    where: { id: input.new_owner_member_id, group_id: groupId },
    include: { user: { select: { username: true } } },
  });
  if (!newOwner) {
    throw new GroupError("Member not found", 404, "MEMBER_NOT_FOUND");
  }
  if (newOwner.id === currentOwner.id) {
    throw new GroupError("You are already the owner", 400, "ALREADY_OWNER");
  }

  await prisma.$transaction([
    prisma.groupMember.update({
      where: { id: currentOwner.id },
      data: { role: "admin" },
    }),
    prisma.groupMember.update({
      where: { id: newOwner.id },
      data: { role: "owner" },
    }),
    prisma.group.update({
      where: { id: groupId },
      data: { created_by: newOwner.user_id },
    }),
  ]);

  const members = await prisma.groupMember.findMany({
    where: { group_id: groupId },
    include: { user: { select: { username: true } } },
    orderBy: [{ role: "desc" }, { joined_at: "asc" }],
  });

  const balances = await Promise.all(
    members.map((m) => getMemberBalance(groupId, m.id)),
  );

  return members.map((m, i) => toPublicGroupMember(m, balances[i]));
}
