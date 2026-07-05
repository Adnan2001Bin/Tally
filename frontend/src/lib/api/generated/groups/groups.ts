import type {
  CreateGroupBody,
  CreateGroupExpenseBody,
  CreateGroupSettlementBody,
  GroupDetail,
  GroupExpense,
  GroupSettlement,
  GroupSummary,
  GroupsList,
  JoinGroupBody,
  JoinRequest,
  JoinRequestsList,
  RespondJoinRequestBody,
} from "../../models/groups/group";
import { customInstance } from "../../axios-instance";

export const getGroups = () => {
  const createGroup = (body: CreateGroupBody) =>
    customInstance<GroupSummary>({
      url: "/groups",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const listGroups = () =>
    customInstance<GroupsList>({
      url: "/groups",
      method: "GET",
    });

  const getGroup = (groupId: string) =>
    customInstance<GroupDetail>({
      url: `/groups/${groupId}`,
      method: "GET",
    });

  const joinGroup = (body: JoinGroupBody) =>
    customInstance<JoinRequest>({
      url: "/groups/join",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const listJoinRequests = (groupId: string) =>
    customInstance<JoinRequestsList>({
      url: `/groups/${groupId}/requests`,
      method: "GET",
    });

  const respondJoinRequest = (
    groupId: string,
    requestId: string,
    body: RespondJoinRequestBody,
  ) =>
    customInstance<JoinRequest>({
      url: `/groups/${groupId}/requests/${requestId}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const createGroupExpense = (groupId: string, body: CreateGroupExpenseBody) =>
    customInstance<GroupExpense>({
      url: `/groups/${groupId}/expenses`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  const createGroupSettlement = (groupId: string, body: CreateGroupSettlementBody) =>
    customInstance<GroupSettlement>({
      url: `/groups/${groupId}/settlements`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: body,
    });

  return {
    createGroup,
    listGroups,
    getGroup,
    joinGroup,
    listJoinRequests,
    respondJoinRequest,
    createGroupExpense,
    createGroupSettlement,
  };
};
