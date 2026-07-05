import { prisma } from "../../../lib/prisma.js";
import { toPublicUser, type UserPublic } from "../../../models/user.js";
import { UserError } from "../users.types.js";
import type { UpdateProfileInput } from "../users.types.js";

export async function getMe(userId: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UserError("User not found", 404, "USER_NOT_FOUND");
  }
  return toPublicUser(user);
}

export async function updateMe(userId: string, input: UpdateProfileInput): Promise<UserPublic> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new UserError("User not found", 404, "USER_NOT_FOUND");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.monthly_budget !== undefined
        ? { monthly_budget: input.monthly_budget }
        : {}),
    },
  });

  return toPublicUser(updated);
}
