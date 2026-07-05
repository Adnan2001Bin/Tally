import { computeOwed, personalShare, type ExpenseEvent } from "../../../lib/balance.js";
import { fromMinor, toMinor } from "../../../lib/group-utils.js";
import { prisma } from "../../../lib/prisma.js";
import { toPublicGroupExpense } from "../../../models/group.js";
import type { GroupExpensePublic } from "../../../models/group.js";
import type { CreateGroupExpenseInput } from "../groups.types.js";
import { GroupError } from "../groups.types.js";
import { requireMembership } from "./permissions.service.js";

export async function createGroupExpense(
  groupId: string,
  userId: string,
  input: CreateGroupExpenseInput,
): Promise<GroupExpensePublic> {
  await requireMembership(groupId, userId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new GroupError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  const members = await prisma.groupMember.findMany({
    where: { group_id: groupId, id: { in: input.participants } },
  });
  if (members.length !== input.participants.length) {
    throw new GroupError("One or more participants are not group members", 400, "INVALID_PARTICIPANTS");
  }

  const payer = await prisma.groupMember.findFirst({
    where: { id: input.paid_by_member_id, group_id: groupId },
  });
  if (!payer) {
    throw new GroupError("Payer is not a group member", 400, "INVALID_PAYER");
  }

  const totalMinor = toMinor(input.total);
  const splitValuesMinor: Record<string, number> = {};
  if (input.split_values) {
    for (const [memberId, value] of Object.entries(input.split_values)) {
      splitValuesMinor[memberId] =
        input.split_method === "exact" ? toMinor(value) : value;
    }
  }

  let owedMinor: Record<string, number>;
  try {
    owedMinor = computeOwed(totalMinor, {
      method: input.split_method,
      participants: input.participants,
      values: splitValuesMinor,
    });
  } catch {
    throw new GroupError("Split amounts do not match the total", 400, "INVALID_SPLIT");
  }

  const currency = (input.currency ?? group.currency).toUpperCase();
  const description = input.description.trim();

  const expenseEvent: ExpenseEvent = {
    kind: "expense",
    id: "draft",
    total: totalMinor,
    payers: [{ member: payer.id, amount: totalMinor }],
    split: {
      method: input.split_method,
      participants: input.participants,
      values: owedMinor,
    },
  };

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.groupExpense.create({
      data: {
        group_id: groupId,
        description,
        category: input.category?.trim() || null,
        total: input.total,
        currency,
        paid_by_member_id: payer.id,
        split_method: input.split_method,
        created_by: userId,
        splits: {
          create: Object.entries(owedMinor).map(([memberId, amountMinor]) => ({
            member_id: memberId,
            amount: fromMinor(amountMinor),
          })),
        },
      },
      include: { splits: true },
    });

    const membersWithUsers = await tx.groupMember.findMany({
      where: { group_id: groupId },
      include: { user: { select: { id: true } } },
    });

    for (const member of membersWithUsers) {
      const shareMinor = personalShare(
        { ...expenseEvent, id: created.id },
        member.id,
      );
      if (shareMinor <= 0) continue;

      await tx.personalExpense.create({
        data: {
          user_id: member.user_id,
          amount: fromMinor(shareMinor),
          description: `Group share: ${description} (${group.name})`,
          currency,
          source_group_expense_id: created.id,
        },
      });
    }

    return created;
  });

  return toPublicGroupExpense(expense);
}
