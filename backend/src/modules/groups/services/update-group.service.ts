import { prisma } from "../../../lib/prisma.js";
import { toGroupSummary } from "../../../models/group.js";
import type { GroupSummaryPublic } from "../../../models/group.js";
import type { UpdateGroupInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { getGroupBalances, getTotalExpenses } from "./balance.service.js";
import { requireMinRole } from "./permissions.service.js";

export async function updateGroup(
  groupId: string,
  userId: string,
  input: UpdateGroupInput,
): Promise<GroupSummaryPublic> {
  await requireMinRole(groupId, userId, "admin");

  const data: {
    name?: string;
    description?: string | null;
    type?: UpdateGroupInput["type"];
  } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new GroupError("Group name is required", 400, "INVALID_NAME");
    data.name = name;
  }
  if (input.description !== undefined) {
    data.description = input.description.trim() || null;
  }
  if (input.type !== undefined) {
    data.type = input.type;
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data,
  });

  const membership = await prisma.groupMember.findFirst({
    where: { group_id: groupId, user_id: userId },
  });

  const [memberCount, totalExpenses, balances] = await Promise.all([
    prisma.groupMember.count({ where: { group_id: groupId } }),
    getTotalExpenses(groupId),
    getGroupBalances(groupId),
  ]);

  const yourBalance = membership ? (balances[membership.id] ?? 0) : 0;
  return toGroupSummary(group, memberCount, totalExpenses, yourBalance);
}
