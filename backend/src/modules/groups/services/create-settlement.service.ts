import { prisma } from "../../../lib/prisma.js";
import { toPublicGroupSettlement } from "../../../models/group.js";
import type { GroupSettlementPublic } from "../../../models/group.js";
import type { CreateGroupSettlementInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { requireMembership } from "./permissions.service.js";

export async function createGroupSettlement(
  groupId: string,
  userId: string,
  input: CreateGroupSettlementInput,
): Promise<GroupSettlementPublic> {
  await requireMembership(groupId, userId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new GroupError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  if (input.from_member_id === input.to_member_id) {
    throw new GroupError("Cannot settle with yourself", 400, "INVALID_SETTLEMENT");
  }

  const [fromMember, toMember] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { id: input.from_member_id, group_id: groupId },
    }),
    prisma.groupMember.findFirst({
      where: { id: input.to_member_id, group_id: groupId },
    }),
  ]);

  if (!fromMember || !toMember) {
    throw new GroupError("Settlement members must belong to the group", 400, "INVALID_MEMBERS");
  }

  const settlement = await prisma.groupSettlement.create({
    data: {
      group_id: groupId,
      from_member_id: fromMember.id,
      to_member_id: toMember.id,
      amount: input.amount,
      currency: (input.currency ?? group.currency).toUpperCase(),
      created_by: userId,
    },
  });

  return toPublicGroupSettlement(settlement);
}
