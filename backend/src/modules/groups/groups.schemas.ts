import type { GroupMemberRole, GroupType } from "@prisma/client";
import type {
  GroupDetailPublic,
  GroupExpensePublic,
  GroupSettlementPublic,
  GroupSummaryPublic,
  JoinRequestPublic,
} from "../../models/group.js";

export const groupsTag = "Groups";
export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

export const groupsOperationIds = {
  createGroup: "createGroup",
  listGroups: "listGroups",
  getGroup: "getGroup",
  updateGroup: "updateGroup",
  deleteGroup: "deleteGroup",
  joinGroup: "joinGroup",
  listJoinRequests: "listJoinRequests",
  respondJoinRequest: "respondJoinRequest",
  updateMember: "updateMember",
  removeMember: "removeMember",
  leaveGroup: "leaveGroup",
  transferOwnership: "transferOwnership",
  createGroupExpense: "createGroupExpense",
  createGroupSettlement: "createGroupSettlement",
} as const;

export const schemaRef = {
  createGroupBody: "CreateGroupBody",
  updateGroupBody: "UpdateGroupBody",
  joinGroupBody: "JoinGroupBody",
  respondJoinRequestBody: "RespondJoinRequestBody",
  updateMemberBody: "UpdateMemberBody",
  transferOwnershipBody: "TransferOwnershipBody",
  createGroupExpenseBody: "CreateGroupExpenseBody",
  createGroupSettlementBody: "CreateGroupSettlementBody",
  groupSummary: "GroupSummary",
  groupDetail: "GroupDetail",
  groupsList: "GroupsList",
  groupMember: "GroupMember",
  groupExpense: "GroupExpense",
  groupSettlement: "GroupSettlement",
  joinRequest: "JoinRequest",
  joinRequestsList: "JoinRequestsList",
  groupIdParams: "GroupIdParams",
  groupMemberParams: "GroupMemberParams",
  joinRequestParams: "JoinRequestParams",
  apiError: "ApiError",
} as const;

export const currencyPattern = "^[A-Z]{3}$";

export const groupTypeEnum = [
  "friends",
  "family",
  "office",
  "trip",
  "roommates",
  "custom",
] as const satisfies readonly GroupType[];

export const groupMemberRoleEnum = [
  "owner",
  "admin",
  "member",
] as const satisfies readonly GroupMemberRole[];

export const splitMethodEnum = ["equal", "exact", "percent", "shares"] as const;

export const createGroupBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 1000 },
    type: { type: "string", enum: [...groupTypeEnum], default: "custom" },
    currency: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      pattern: currencyPattern,
      default: "BDT",
    },
  },
} as const;

export const updateGroupBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    description: { type: "string", maxLength: 1000 },
    type: { type: "string", enum: [...groupTypeEnum] },
  },
} as const;

export const joinGroupBodySchema = {
  type: "object",
  required: ["invite_code"],
  additionalProperties: false,
  properties: {
    invite_code: { type: "string", minLength: 4, maxLength: 12 },
  },
} as const;

export const respondJoinRequestBodySchema = {
  type: "object",
  required: ["action"],
  additionalProperties: false,
  properties: {
    action: { type: "string", enum: ["accept", "reject"] },
  },
} as const;

export const updateMemberBodySchema = {
  type: "object",
  required: ["role"],
  additionalProperties: false,
  properties: {
    role: { type: "string", enum: ["admin", "member"] },
  },
} as const;

export const transferOwnershipBodySchema = {
  type: "object",
  required: ["new_owner_member_id"],
  additionalProperties: false,
  properties: {
    new_owner_member_id: { type: "string", format: "uuid" },
  },
} as const;

export const createGroupExpenseBodySchema = {
  type: "object",
  required: ["description", "total", "paid_by_member_id", "split_method", "participants"],
  additionalProperties: false,
  properties: {
    description: { type: "string", minLength: 1, maxLength: 500 },
    category: { type: "string", maxLength: 100 },
    total: { type: "number", exclusiveMinimum: 0, maximum: 999_999_999_999.99 },
    currency: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      pattern: currencyPattern,
    },
    paid_by_member_id: { type: "string", format: "uuid" },
    split_method: { type: "string", enum: [...splitMethodEnum] },
    participants: {
      type: "array",
      minItems: 1,
      items: { type: "string", format: "uuid" },
    },
    split_values: {
      type: "object",
      additionalProperties: { type: "number" },
    },
  },
} as const;

export const createGroupSettlementBodySchema = {
  type: "object",
  required: ["from_member_id", "to_member_id", "amount"],
  additionalProperties: false,
  properties: {
    from_member_id: { type: "string", format: "uuid" },
    to_member_id: { type: "string", format: "uuid" },
    amount: { type: "number", exclusiveMinimum: 0, maximum: 999_999_999_999.99 },
    currency: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      pattern: currencyPattern,
    },
  },
} as const;

export const groupIdParamsSchema = {
  type: "object",
  required: ["groupId"],
  properties: {
    groupId: { type: "string", format: "uuid" },
  },
} as const;

export const groupMemberParamsSchema = {
  type: "object",
  required: ["groupId", "memberId"],
  properties: {
    groupId: { type: "string", format: "uuid" },
    memberId: { type: "string", format: "uuid" },
  },
} as const;

export const joinRequestParamsSchema = {
  type: "object",
  required: ["groupId", "requestId"],
  properties: {
    groupId: { type: "string", format: "uuid" },
    requestId: { type: "string", format: "uuid" },
  },
} as const;

export const groupMemberPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    username: { type: "string" },
    display_name: { type: "string" },
    role: { type: "string", enum: [...groupMemberRoleEnum] },
    balance: { type: "number" },
    joined_at: { type: "string", format: "date-time" },
  },
} as const;

export const groupSummaryPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    type: { type: "string", enum: [...groupTypeEnum] },
    invite_code: { type: "string" },
    currency: { type: "string" },
    created_by: { type: "string", format: "uuid" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
    member_count: { type: "number" },
    total_expenses: { type: "number" },
    your_balance: { type: "number" },
    you_owe: { type: "number" },
    others_owe_you: { type: "number" },
  },
} as const;

export const groupExpensePublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    group_id: { type: "string", format: "uuid" },
    description: { type: "string" },
    category: { type: "string", nullable: true },
    total: { type: "number" },
    currency: { type: "string" },
    paid_by_member_id: { type: "string", format: "uuid" },
    split_method: { type: "string" },
    splits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          member_id: { type: "string", format: "uuid" },
          amount: { type: "number" },
        },
      },
    },
    created_by: { type: "string", format: "uuid" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
} as const;

export const groupSettlementPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    group_id: { type: "string", format: "uuid" },
    from_member_id: { type: "string", format: "uuid" },
    to_member_id: { type: "string", format: "uuid" },
    amount: { type: "number" },
    currency: { type: "string" },
    created_by: { type: "string", format: "uuid" },
    created_at: { type: "string", format: "date-time" },
  },
} as const;

export const groupDetailPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    type: { type: "string", enum: [...groupTypeEnum] },
    invite_code: { type: "string" },
    currency: { type: "string" },
    created_by: { type: "string", format: "uuid" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
    member_count: { type: "number" },
    total_expenses: { type: "number" },
    your_balance: { type: "number" },
    you_owe: { type: "number" },
    others_owe_you: { type: "number" },
    members: {
      type: "array",
      items: { $ref: `${schemaRef.groupMember}#` },
    },
    expenses: {
      type: "array",
      items: { $ref: `${schemaRef.groupExpense}#` },
    },
    settlements: {
      type: "array",
      items: { $ref: `${schemaRef.groupSettlement}#` },
    },
  },
} as const;

export const joinRequestPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    group_id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    username: { type: "string" },
    display_name: { type: "string" },
    status: { type: "string", enum: ["pending", "accepted", "rejected"] },
    created_at: { type: "string", format: "date-time" },
  },
} as const;

export type { GroupDetailPublic, GroupExpensePublic, GroupSettlementPublic, GroupSummaryPublic, JoinRequestPublic };
