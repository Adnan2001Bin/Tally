import type { GroupMemberRole, GroupType } from "@prisma/client";
import type { SplitMethod } from "../../lib/balance.js";
import type {
  GroupDetailPublic,
  GroupExpensePublic,
  GroupSettlementPublic,
  GroupSummaryPublic,
  JoinRequestPublic,
} from "../../models/group.js";

export type { GroupDetailPublic, GroupExpensePublic, GroupSettlementPublic, GroupSummaryPublic, JoinRequestPublic };

export type CreateGroupInput = {
  name: string;
  description?: string;
  type?: GroupType;
  currency?: string;
};

export type UpdateGroupInput = {
  name?: string;
  description?: string;
  type?: GroupType;
};

export type JoinGroupInput = {
  invite_code: string;
};

export type RespondJoinRequestInput = {
  action: "accept" | "reject";
};

export type UpdateMemberInput = {
  role: "admin" | "member";
};

export type TransferOwnershipInput = {
  new_owner_member_id: string;
};

export type CreateGroupExpenseInput = {
  description: string;
  category?: string;
  total: number;
  currency?: string;
  paid_by_member_id: string;
  split_method: SplitMethod;
  participants: string[];
  split_values?: Record<string, number>;
};

export type CreateGroupSettlementInput = {
  from_member_id: string;
  to_member_id: string;
  amount: number;
  currency?: string;
};

export class GroupError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "GroupError";
  }
}

export const ROLE_RANK: Record<GroupMemberRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};
