import { useEffect, type MutableRefObject } from "react";
import { getStoredUser } from "@/lib/auth/auth-storage";
import {
  getGroupErrorMessage,
  useCreateGroupExpenseMutation,
  useCreateGroupMutation,
  useCreateGroupSettlementMutation,
  useGroupsQuery,
  useJoinGroupMutation,
} from "@/lib/hooks/use-groups";
import { getGroups } from "@/lib/api/generated/groups/groups";
import type { GroupDetail } from "@/lib/api/models/groups/group";
import {
  createGroupBody,
  detailToGroup,
  summaryToGroup,
} from "@/lib/tally/group-mapper";
import type { GroupHandlers } from "@/lib/tally/group-handlers";
import { useTally } from "@/lib/tally/store";

const groupsApi = getGroups();

function canManageJoinRequests(detail: GroupDetail, userId?: string): boolean {
  if (!userId) return false;
  const me = detail.members.find((m) => m.user_id === userId);
  return me?.role === "owner" || me?.role === "admin";
}

type GroupsBridgeProps = {
  handlersRef: MutableRefObject<GroupHandlers | null>;
};

/** Syncs API groups into the tally store and wires group handlers for signed-in mode. */
export function GroupsBridge({ handlersRef }: GroupsBridgeProps) {
  const { data, isSuccess } = useGroupsQuery();
  const createGroupMutation = useCreateGroupMutation();
  const joinGroupMutation = useJoinGroupMutation();
  const createExpenseMutation = useCreateGroupExpenseMutation();
  const createSettlementMutation = useCreateGroupSettlementMutation();
  const { actions } = useTally();
  const storedUser = getStoredUser();
  const currentUser = storedUser
    ? { id: storedUser.id, display_name: storedUser.display_name }
    : null;

  useEffect(() => {
    const syncJoinRequestsForDetail = async (detail: GroupDetail) => {
      if (!canManageJoinRequests(detail, storedUser?.id)) {
        actions.syncJoinRequests([]);
        return;
      }
      const { requests } = await groupsApi.listJoinRequests(detail.id);
      actions.syncJoinRequests(
        requests.map((r) => ({
          id: r.id,
          username: r.username,
          display_name: r.display_name,
          created_at: r.created_at,
        })),
      );
    };

    handlersRef.current = {
      isLive: true,
      createGroup: async (input) => {
        const created = await createGroupMutation.mutateAsync(createGroupBody(input));
        const detail = await groupsApi.getGroup(created.id);
        actions.syncGroupDetail(detail, currentUser);
        await syncJoinRequestsForDetail(detail);
        return {
          id: created.id,
          name: created.name,
          invite_code: created.invite_code,
        };
      },
      joinGroup: async (input) => {
        await joinGroupMutation.mutateAsync({
          invite_code: input.invite_code.trim().toUpperCase(),
        });
      },
      loadGroupDetail: async (groupId) => {
        const detail = await groupsApi.getGroup(groupId);
        actions.syncGroupDetail(detail, currentUser);
        await syncJoinRequestsForDetail(detail);
      },
      respondJoinRequest: async (groupId, requestId, action) => {
        await groupsApi.respondJoinRequest(groupId, requestId, { action });
        const detail = await groupsApi.getGroup(groupId);
        actions.syncGroupDetail(detail, currentUser);
        await syncJoinRequestsForDetail(detail);
      },
      createGroupExpense: async (groupId, body) => {
        await createExpenseMutation.mutateAsync({ groupId, body });
        const detail = await groupsApi.getGroup(groupId);
        actions.syncGroupDetail(detail, currentUser);
      },
      createSettlement: async (input) => {
        await createSettlementMutation.mutateAsync({
          groupId: input.groupId,
          body: {
            from_member_id: input.from_member_id,
            to_member_id: input.to_member_id,
            amount: input.amount,
          },
        });
        const detail = await groupsApi.getGroup(input.groupId);
        actions.syncGroupDetail(detail, currentUser);
      },
      getErrorMessage: getGroupErrorMessage,
    };
  }, [
    actions,
    createExpenseMutation,
    createGroupMutation,
    createSettlementMutation,
    currentUser,
    handlersRef,
    joinGroupMutation,
    storedUser?.id,
  ]);

  useEffect(() => {
    if (!isSuccess || !data) return;
    actions.syncApiGroups(
      data.groups.map((g) => summaryToGroup(g, storedUser?.display_name ?? null)),
    );
  }, [actions, data, isSuccess, storedUser?.display_name]);

  return null;
}
