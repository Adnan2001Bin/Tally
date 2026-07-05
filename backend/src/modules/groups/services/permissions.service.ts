import type { GroupMember, GroupMemberRole } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { GroupError, ROLE_RANK } from "../groups.types.js";

export type Membership = GroupMember;

export async function getMembership(
  groupId: string,
  userId: string,
): Promise<Membership | null> {
  return prisma.groupMember.findFirst({
    where: { group_id: groupId, user_id: userId },
  });
}

export async function requireMembership(
  groupId: string,
  userId: string,
): Promise<Membership> {
  const membership = await getMembership(groupId, userId);
  if (!membership) {
    throw new GroupError("You are not a member of this group", 403, "NOT_A_MEMBER");
  }
  return membership;
}

export async function requireMinRole(
  groupId: string,
  userId: string,
  minRole: GroupMemberRole,
): Promise<Membership> {
  const membership = await requireMembership(groupId, userId);
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new GroupError("Insufficient permissions", 403, "FORBIDDEN");
  }
  return membership;
}

export function assertCanManageMember(
  actor: Membership,
  target: Membership,
): void {
  if (target.role === "owner") {
    throw new GroupError("Cannot modify the group owner", 403, "CANNOT_MODIFY_OWNER");
  }
  if (actor.role === "admin" && target.role === "admin") {
    throw new GroupError("Admins cannot modify other admins", 403, "FORBIDDEN");
  }
  if (ROLE_RANK[actor.role] < ROLE_RANK.admin) {
    throw new GroupError("Insufficient permissions", 403, "FORBIDDEN");
  }
}
