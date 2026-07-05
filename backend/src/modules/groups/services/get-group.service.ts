import { prisma } from "../../../lib/prisma.js";
import {
  toGroupSummary,
  toPublicGroupExpense,
  toPublicGroupMember,
  toPublicGroupSettlement,
} from "../../../models/group.js";
import type { GroupDetailPublic } from "../../../models/group.js";
import { GroupError } from "../groups.types.js";
import { getGroupBalances, getTotalExpenses } from "./balance.service.js";
import { requireMembership } from "./permissions.service.js";

export async function getGroup(
  groupId: string,
  userId: string,
): Promise<GroupDetailPublic> {
  await requireMembership(groupId, userId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new GroupError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  const [members, expenses, settlements, memberCount, totalExpenses, balances] =
    await Promise.all([
      prisma.groupMember.findMany({
        where: { group_id: groupId },
        include: { user: { select: { username: true } } },
        orderBy: [{ role: "desc" }, { joined_at: "asc" }],
      }),
      prisma.groupExpense.findMany({
        where: { group_id: groupId },
        include: { splits: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.groupSettlement.findMany({
        where: { group_id: groupId },
        orderBy: { created_at: "desc" },
      }),
      prisma.groupMember.count({ where: { group_id: groupId } }),
      getTotalExpenses(groupId),
      getGroupBalances(groupId),
    ]);

  const viewer = members.find((m) => m.user_id === userId);
  const yourBalance = viewer ? (balances[viewer.id] ?? 0) : 0;

  return {
    ...toGroupSummary(group, memberCount, totalExpenses, yourBalance),
    members: members.map((m) => toPublicGroupMember(m, balances[m.id] ?? 0)),
    expenses: expenses.map(toPublicGroupExpense),
    settlements: settlements.map(toPublicGroupSettlement),
  };
}
