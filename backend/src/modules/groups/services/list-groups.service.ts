import { prisma } from "../../../lib/prisma.js";
import { toGroupSummary } from "../../../models/group.js";
import type { GroupSummaryPublic } from "../../../models/group.js";
import { getGroupBalances, getTotalExpenses } from "./balance.service.js";
import { getMembership } from "./permissions.service.js";

export async function listGroups(userId: string): Promise<GroupSummaryPublic[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { user_id: userId },
    include: { group: true },
    orderBy: { joined_at: "desc" },
  });

  const summaries: GroupSummaryPublic[] = [];

  for (const membership of memberships) {
    const [memberCount, totalExpenses, balances] = await Promise.all([
      prisma.groupMember.count({ where: { group_id: membership.group_id } }),
      getTotalExpenses(membership.group_id),
      getGroupBalances(membership.group_id),
    ]);

    summaries.push(
      toGroupSummary(
        membership.group,
        memberCount,
        totalExpenses,
        balances[membership.id] ?? 0,
      ),
    );
  }

  return summaries;
}

export async function getGroupSummaryForUser(
  groupId: string,
  userId: string,
): Promise<GroupSummaryPublic | null> {
  const membership = await getMembership(groupId, userId);
  if (!membership) return null;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return null;

  const [memberCount, totalExpenses, balances] = await Promise.all([
    prisma.groupMember.count({ where: { group_id: groupId } }),
    getTotalExpenses(groupId),
    getGroupBalances(groupId),
  ]);

  return toGroupSummary(group, memberCount, totalExpenses, balances[membership.id] ?? 0);
}
