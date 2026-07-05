import type { Draft, Group, GroupMember } from "./types";
import type {
  CreateGroupBody,
  CreateGroupExpenseBody,
  GroupDetail,
  GroupExpense,
  GroupSummary,
} from "@/lib/api/models/groups/group";
import type { Entry } from "./types";
import { computeOwed } from "@/lib/core";

function formatWhen(iso: string): { when: string; time: string } {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let when: string;
  if (startOfDate.getTime() === startOfToday.getTime()) when = "Today";
  else if (startOfDate.getTime() === startOfYesterday.getTime()) when = "Yesterday";
  else when = "Earlier";

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { when, time };
}

export function memberDisplayName(
  displayName: string,
  memberUserId: string,
  currentUser: { id?: string; display_name?: string } | null,
): string {
  if (currentUser?.id && currentUser.id === memberUserId) return "You";
  return displayName;
}

export function summaryToGroup(
  summary: GroupSummary,
  currentDisplayName: string | null,
): Group {
  return {
    id: summary.id,
    name: summary.name,
    description: summary.description,
    type: summary.type,
    inviteCode: summary.invite_code,
    currency: summary.currency,
    memberCount: summary.member_count,
    yourBalance: summary.your_balance,
    members: [
      {
        id: "self",
        name: currentDisplayName?.trim() || "You",
        net: summary.your_balance,
      },
    ],
  };
}

export function detailToGroup(detail: GroupDetail, currentUser: { id?: string; display_name?: string } | null): Group {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    type: detail.type,
    inviteCode: detail.invite_code,
    currency: detail.currency,
    memberCount: detail.member_count,
    yourBalance: detail.your_balance,
    members: detail.members.map((m) => ({
      id: m.id,
      userId: m.user_id,
      name: memberDisplayName(m.display_name, m.user_id, currentUser),
      net: m.balance,
      role: m.role,
    })),
  };
}

export function apiGroupExpenseToEntry(
  expense: GroupExpense,
  groupName: string,
  members: GroupMember[],
  _currentUser: { id?: string; display_name?: string } | null,
): Entry {
  const { when, time } = formatWhen(expense.created_at);
  const payer = members.find((m) => m.id === expense.paid_by_member_id);
  const payerName = payer?.name ?? "Someone";
  const youMember = members.find((m) => m.name === "You");
  const yourShare =
    expense.splits.find((s) => s.member_id === youMember?.id)?.amount ?? 0;
  const youPaid = payerName === "You";

  const parts = expense.splits.map((s) => {
    const member = members.find((m) => m.id === s.member_id);
    return {
      name: member?.name ?? "Member",
      owed: s.amount,
    };
  });

  return {
    id: expense.id,
    when,
    time,
    title: expense.description,
    sub:
      (groupName ? groupName + " · " : "") +
      (youPaid ? "you paid ৳" + expense.total.toLocaleString("en-BD") : payerName + " paid"),
    cat: expense.category ?? "other",
    amount: youPaid ? expense.total - yourShare : yourShare,
    kind: youPaid ? "owed" : "share",
    at: expense.created_at,
    total: expense.total,
    paidBy: payerName,
    group: groupName,
    parts,
    yourShare,
    createdBy: expense.created_by,
    groupId: expense.group_id,
    splitMethod:
      expense.split_method === "exact" ? "exact" : "equal",
  };
}

/** Build a split draft from a group expense entry for editing. */
export function entryToDraft(entry: Entry, group: Group): Draft | null {
  if (!entry.total && !entry.parts?.length) return null;
  const total = entry.total ?? entry.amount;
  if (!total) return null;

  const allMembers = group.members.length ? group.members.map((m) => m.name) : ["You"];
  const parts = entry.parts?.length
    ? entry.parts.map((p) => p.name)
    : allMembers;
  const payer =
    entry.paidBy && allMembers.includes(entry.paidBy) ? entry.paidBy : "You";
  const method: "equal" | "exact" =
    entry.splitMethod === "exact" ? "exact" : "equal";

  let owed: Record<string, number>;
  if (method === "exact" && entry.parts?.length) {
    owed = {};
    for (const p of entry.parts) owed[p.name] = p.owed;
  } else {
    owed = computeOwed(total, { method: "equal", participants: parts });
  }

  return {
    title: entry.title,
    total,
    payer,
    parts,
    allMembers,
    method,
    cat: entry.cat,
    group: group.name,
    isShared: true,
    unresolved: [],
    owed,
  };
}

export function createGroupBody(input: { name: string; description?: string }): CreateGroupBody {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    type: "custom",
  };
}

export function draftToCreateExpenseBody(
  draft: Draft,
  group: Group,
): CreateGroupExpenseBody | null {
  const nameToMember = new Map(group.members.map((m) => [m.name, m]));
  const payer = nameToMember.get(draft.payer);
  if (!payer?.id) return null;

  const participants: string[] = [];
  for (const part of draft.parts) {
    const member = nameToMember.get(part);
    if (member?.id) participants.push(member.id);
  }
  if (!participants.length) return null;

  const split_values: Record<string, number> = {};
  if (draft.method === "exact") {
    for (const part of draft.parts) {
      const member = nameToMember.get(part);
      if (member?.id) split_values[member.id] = draft.owed[part] ?? 0;
    }
  }

  return {
    description: draft.title.trim() || "Expense",
    category: draft.cat !== "other" ? draft.cat : undefined,
    total: draft.total,
    paid_by_member_id: payer.id,
    split_method: draft.method,
    participants,
    split_values: draft.method === "exact" ? split_values : undefined,
  };
}

export function inviteLinkForCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/^TALLY-/i, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin}/group/join?code=${encodeURIComponent(normalized)}`;
  }
  return `https://app.com/group/join?code=${encodeURIComponent(normalized)}`;
}
