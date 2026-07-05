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
import {
  createGroupBody,
  detailToGroup,
  summaryToGroup,
} from "@/lib/tally/group-mapper";
import type { GroupHandlers } from "@/lib/tally/group-handlers";
import { useTally } from "@/lib/tally/store";

const groupsApi = getGroups();

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
    handlersRef.current = {
      isLive: true,
      createGroup: async (input) => {
        const created = await createGroupMutation.mutateAsync(createGroupBody(input));
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
  ]);

  useEffect(() => {
    if (!isSuccess || !data) return;
    actions.syncApiGroups(
      data.groups.map((g) => summaryToGroup(g, storedUser?.display_name ?? null)),
    );
  }, [actions, data, isSuccess, storedUser?.display_name]);

  return null;
}
