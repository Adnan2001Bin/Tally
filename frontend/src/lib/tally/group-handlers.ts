import type { CreateGroupExpenseBody } from "@/lib/api/models/groups/group";
import type { Draft, Group } from "./types";

export type CreateGroupInput = {
  name: string;
  description?: string;
};

export type JoinGroupInput = {
  invite_code: string;
};

export type SettleGroupInput = {
  groupId: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
};

export type GroupHandlers = {
  isLive: boolean;
  createGroup: (input: CreateGroupInput) => Promise<{ id: string; name: string; invite_code: string }>;
  joinGroup: (input: JoinGroupInput) => Promise<void>;
  loadGroupDetail: (groupId: string) => Promise<void>;
  createGroupExpense: (groupId: string, body: CreateGroupExpenseBody) => Promise<void>;
  createSettlement: (input: SettleGroupInput) => Promise<void>;
  getErrorMessage: (error: unknown) => string;
};

export type { Draft, Group };
