import { prisma } from "../../../lib/prisma.js";
import { GroupError } from "../groups.types.js";
import { requireMinRole } from "./permissions.service.js";

export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  await requireMinRole(groupId, userId, "owner");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new GroupError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  await prisma.group.delete({ where: { id: groupId } });
}
