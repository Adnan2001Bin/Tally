import { prisma } from "../../../lib/prisma.js";
import { balanceFromEvents, type GroupEvent } from "../../../lib/balance.js";
import { decimalToNumber, fromMinor, toMinor } from "../../../lib/group-utils.js";

export async function loadGroupEvents(groupId: string): Promise<GroupEvent[]> {
  const [expenses, settlements] = await Promise.all([
    prisma.groupExpense.findMany({
      where: { group_id: groupId },
      include: { splits: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.groupSettlement.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: "asc" },
    }),
  ]);

  const events: GroupEvent[] = [];

  for (const expense of expenses) {
    const totalMinor = toMinor(decimalToNumber(expense.total));
    const splitValues: Record<string, number> = {};
    const participants: string[] = [];
    for (const split of expense.splits) {
      participants.push(split.member_id);
      splitValues[split.member_id] = toMinor(decimalToNumber(split.amount));
    }

    events.push({
      kind: "expense",
      id: expense.id,
      total: totalMinor,
      payers: [{ member: expense.paid_by_member_id, amount: totalMinor }],
      split: {
        method: "exact",
        participants,
        values: splitValues,
      },
    });
  }

  for (const settlement of settlements) {
    events.push({
      kind: "settlement",
      id: settlement.id,
      from: settlement.from_member_id,
      to: settlement.to_member_id,
      amount: toMinor(decimalToNumber(settlement.amount)),
    });
  }

  return events;
}

export async function getGroupBalances(groupId: string): Promise<Record<string, number>> {
  const events = await loadGroupEvents(groupId);
  const balancesMinor = balanceFromEvents(events);
  const balances: Record<string, number> = {};
  for (const [memberId, minor] of Object.entries(balancesMinor)) {
    balances[memberId] = fromMinor(minor);
  }
  return balances;
}

export async function getMemberBalance(groupId: string, memberId: string): Promise<number> {
  const balances = await getGroupBalances(groupId);
  return balances[memberId] ?? 0;
}

export async function getTotalExpenses(groupId: string): Promise<number> {
  const result = await prisma.groupExpense.aggregate({
    where: { group_id: groupId },
    _sum: { total: true },
  });
  return result._sum.total ? decimalToNumber(result._sum.total) : 0;
}
