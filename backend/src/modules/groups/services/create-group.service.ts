import type { GroupMemberRole } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { generateInviteCode } from "../../../lib/group-utils.js";
import { toGroupSummary } from "../../../models/group.js";
import type { GroupSummaryPublic } from "../../../models/group.js";
import type { CreateGroupInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";

const MAX_INVITE_RETRIES = 5;

export async function createGroup(
  userId: string,
  input: CreateGroupInput,
): Promise<GroupSummaryPublic> {
  const name = input.name.trim();
  if (!name) {
    throw new GroupError("Group name is required", 400, "INVALID_NAME");
  }

  for (let attempt = 0; attempt < MAX_INVITE_RETRIES; attempt++) {
    const inviteCode = generateInviteCode();
    try {
      const group = await prisma.$transaction(async (tx) => {
        const created = await tx.group.create({
          data: {
            name,
            description: input.description?.trim() || null,
            type: input.type ?? "custom",
            currency: (input.currency ?? "BDT").toUpperCase(),
            invite_code: inviteCode,
            created_by: userId,
            members: {
              create: {
                user_id: userId,
                role: "owner" satisfies GroupMemberRole,
              },
            },
          },
        });
        return created;
      });

      return toGroupSummary(group, 1, 0, 0);
    } catch (error) {
      const isUniqueViolation =
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isUniqueViolation || attempt === MAX_INVITE_RETRIES - 1) {
        throw error;
      }
    }
  }

  throw new GroupError("Could not create group", 500, "CREATE_FAILED");
}
