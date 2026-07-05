import type {
  Group,
  GroupExpense,
  GroupExpenseSplit,
  GroupMember,
  GroupMemberRole,
  GroupSettlement,
  GroupType,
  GroupJoinRequest,
  JoinRequestStatus,
  User,
} from "@prisma/client";
import { decimalToNumber } from "../lib/group-utils.js";

export type GroupMemberPublic = {
  id: string;
  user_id: string;
  username: string;
  role: GroupMemberRole;
  balance: number;
  joined_at: string;
};

export type GroupExpenseSplitPublic = {
  member_id: string;
  amount: number;
};

export type GroupExpensePublic = {
  id: string;
  group_id: string;
  description: string;
  category: string | null;
  total: number;
  currency: string;
  paid_by_member_id: string;
  split_method: string;
  splits: GroupExpenseSplitPublic[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GroupSettlementPublic = {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency: string;
  created_by: string;
  created_at: string;
};

export type GroupSummaryPublic = {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  invite_code: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  total_expenses: number;
  your_balance: number;
  you_owe: number;
  others_owe_you: number;
};

export type GroupDetailPublic = GroupSummaryPublic & {
  members: GroupMemberPublic[];
  expenses: GroupExpensePublic[];
  settlements: GroupSettlementPublic[];
};

export type JoinRequestPublic = {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  status: JoinRequestStatus;
  created_at: string;
};

type MemberWithUser = GroupMember & { user: Pick<User, "username"> };

export function toPublicGroupMember(
  member: MemberWithUser,
  balance = 0,
): GroupMemberPublic {
  return {
    id: member.id,
    user_id: member.user_id,
    username: member.user.username,
    role: member.role,
    balance,
    joined_at: member.joined_at.toISOString(),
  };
}

export function toPublicGroupExpense(
  expense: GroupExpense & { splits: GroupExpenseSplit[] },
): GroupExpensePublic {
  return {
    id: expense.id,
    group_id: expense.group_id,
    description: expense.description,
    category: expense.category,
    total: decimalToNumber(expense.total),
    currency: expense.currency,
    paid_by_member_id: expense.paid_by_member_id,
    split_method: expense.split_method,
    splits: expense.splits.map((s) => ({
      member_id: s.member_id,
      amount: decimalToNumber(s.amount),
    })),
    created_by: expense.created_by,
    created_at: expense.created_at.toISOString(),
    updated_at: expense.updated_at.toISOString(),
  };
}

export function toPublicGroupSettlement(settlement: GroupSettlement): GroupSettlementPublic {
  return {
    id: settlement.id,
    group_id: settlement.group_id,
    from_member_id: settlement.from_member_id,
    to_member_id: settlement.to_member_id,
    amount: decimalToNumber(settlement.amount),
    currency: settlement.currency,
    created_by: settlement.created_by,
    created_at: settlement.created_at.toISOString(),
  };
}

export function toGroupSummary(
  group: Group,
  memberCount: number,
  totalExpenses: number,
  yourBalance: number,
): GroupSummaryPublic {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    type: group.type,
    invite_code: group.invite_code,
    currency: group.currency,
    created_by: group.created_by,
    created_at: group.created_at.toISOString(),
    updated_at: group.updated_at.toISOString(),
    member_count: memberCount,
    total_expenses: totalExpenses,
    your_balance: yourBalance,
    you_owe: yourBalance < 0 ? Math.abs(yourBalance) : 0,
    others_owe_you: yourBalance > 0 ? yourBalance : 0,
  };
}

export function toPublicJoinRequest(
  request: GroupJoinRequest & { user: Pick<User, "username"> },
): JoinRequestPublic {
  return {
    id: request.id,
    group_id: request.group_id,
    user_id: request.user_id,
    username: request.user.username,
    status: request.status,
    created_at: request.created_at.toISOString(),
  };
}
