import { prisma } from "../../../lib/prisma.js";
import { GroupError } from "../groups.types.js";
import { getMemberBalance } from "./balance.service.js";
import {
  assertCanManageMember,
  requireMembership,
  requireMinRole,
} from "./permissions.service.js";

function formatBalanceMessage(balance: number, username: string): string {
  if (balance < 0) {
    return `${username} still owes ৳${Math.abs(balance).toLocaleString("en-BD")}. Settle before removing.`;
  }
  if (balance > 0) {
    return `${username} is still owed ৳${balance.toLocaleString("en-BD")}. Settle before removing.`;
  }
  return "";
}

export async function removeMember(
  groupId: string,
  memberId: string,
  userId: string,
): Promise<void> {
  const actor = await requireMinRole(groupId, userId, "admin");

  const target = await prisma.groupMember.findFirst({
    where: { id: memberId, group_id: groupId },
    include: { user: { select: { username: true, display_name: true } } },
  });
  if (!target) {
    throw new GroupError("Member not found", 404, "MEMBER_NOT_FOUND");
  }

  assertCanManageMember(actor, target);

  const balance = await getMemberBalance(groupId, target.id);
  if (balance !== 0) {
    throw new GroupError(
      formatBalanceMessage(balance, target.user.display_name),
      409,
      "OUTSTANDING_BALANCE",
    );
  }

  await prisma.groupMember.delete({ where: { id: target.id } });
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membership = await requireMembership(groupId, userId);

  if (membership.role === "owner") {
    const ownerCount = await prisma.groupMember.count({
      where: { group_id: groupId, role: "owner" },
    });
    const memberCount = await prisma.groupMember.count({
      where: { group_id: groupId },
    });
    if (memberCount > 1) {
      throw new GroupError(
        "Transfer ownership before leaving the group",
        409,
        "OWNER_MUST_TRANSFER",
      );
    }
  }

  const balance = await getMemberBalance(groupId, membership.id);
  if (balance !== 0) {
    const message =
      balance < 0
        ? `You still owe ৳${Math.abs(balance).toLocaleString("en-BD")}. Please settle before leaving.`
        : `You are still owed ৳${balance.toLocaleString("en-BD")}. Please settle before leaving.`;
    throw new GroupError(message, 409, "OUTSTANDING_BALANCE");
  }

  await prisma.groupMember.delete({ where: { id: membership.id } });

  const remaining = await prisma.groupMember.count({ where: { group_id: groupId } });
  if (remaining === 0) {
    await prisma.group.delete({ where: { id: groupId } });
  }
}
