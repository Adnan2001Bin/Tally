import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroups } from "@/lib/api/generated/groups/groups";
import type {
  CreateGroupBody,
  CreateGroupExpenseBody,
  CreateGroupSettlementBody,
  JoinGroupBody,
} from "@/lib/api/models/groups/group";
import type { ApiError } from "@/lib/api/types";
import type { AxiosError } from "axios";

const groupsApi = getGroups();

export const groupsQueryKey = ["groups"] as const;

export function groupDetailQueryKey(groupId: string) {
  return ["groups", groupId] as const;
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: groupsQueryKey,
    queryFn: () => groupsApi.listGroups(),
  });
}

export function useGroupDetailQuery(groupId: string, enabled = true) {
  return useQuery({
    queryKey: groupDetailQueryKey(groupId),
    queryFn: () => groupsApi.getGroup(groupId),
    enabled: enabled && Boolean(groupId),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.createGroup(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
    },
  });
}

export function useJoinGroupMutation() {
  return useMutation({
    mutationFn: (body: JoinGroupBody) => groupsApi.joinGroup(body),
  });
}

export function useCreateGroupExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: string; body: CreateGroupExpenseBody }) =>
      groupsApi.createGroupExpense(groupId, body),
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
      void queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateGroupExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      expenseId,
      body,
    }: {
      groupId: string;
      expenseId: string;
      body: CreateGroupExpenseBody;
    }) => groupsApi.updateGroupExpense(groupId, expenseId, body),
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
      void queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useCreateGroupSettlementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: string; body: CreateGroupSettlementBody }) =>
      groupsApi.createGroupSettlement(groupId, body),
    onSuccess: (_data, { groupId }) => {
      void queryClient.invalidateQueries({ queryKey: groupsQueryKey });
      void queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) });
    },
  });
}

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function isSafeUserMessage(message: string): boolean {
  if (message.length > 200) return false;
  return !/prisma|invocation|E:\\|\/src\/|at\s+\S+\s+\(|node_modules/i.test(message);
}

export function getGroupErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message?.trim();

  if (message && isSafeUserMessage(message)) {
    return message;
  }

  const status = axiosError.response?.status;
  if (status === 404) return "Group not found.";
  if (status === 400) return "Please check your input and try again.";
  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 409) return message || "This action isn't allowed right now.";

  return FALLBACK_ERROR;
}
