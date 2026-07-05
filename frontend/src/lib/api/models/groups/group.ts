export type GroupType =
  | "friends"
  | "family"
  | "office"
  | "trip"
  | "roommates"
  | "custom";

export type GroupMemberRole = "owner" | "admin" | "member";

export type GroupMember = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  role: GroupMemberRole;
  balance: number;
  joined_at: string;
};

export type GroupExpenseSplit = {
  member_id: string;
  amount: number;
};

export type GroupExpense = {
  id: string;
  group_id: string;
  description: string;
  category: string | null;
  total: number;
  currency: string;
  paid_by_member_id: string;
  split_method: string;
  splits: GroupExpenseSplit[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GroupSettlement = {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency: string;
  created_by: string;
  created_at: string;
};

export type GroupSummary = {
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

export type GroupDetail = GroupSummary & {
  members: GroupMember[];
  expenses: GroupExpense[];
  settlements: GroupSettlement[];
};

export type GroupsList = {
  groups: GroupSummary[];
};

export type CreateGroupBody = {
  name: string;
  description?: string;
  type?: GroupType;
  currency?: string;
};

export type JoinGroupBody = {
  invite_code: string;
};

export type JoinRequest = {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  display_name: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type JoinRequestsList = {
  requests: JoinRequest[];
};

export type RespondJoinRequestBody = {
  action: "accept" | "reject";
};

export type CreateGroupExpenseBody = {
  description: string;
  category?: string;
  total: number;
  currency?: string;
  paid_by_member_id: string;
  split_method: "equal" | "exact" | "percent" | "shares";
  participants: string[];
  split_values?: Record<string, number>;
};

export type CreateGroupSettlementBody = {
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency?: string;
};
