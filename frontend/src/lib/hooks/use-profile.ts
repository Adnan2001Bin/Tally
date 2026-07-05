import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, type UpdateProfileBody } from "@/lib/api/generated/users/users";
import type { ApiError } from "@/lib/api/types";
import { updateStoredUser } from "@/lib/auth/auth-storage";
import type { AxiosError } from "axios";

const usersApi = getUsers();

export const profileQueryKey = ["profile", "me"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => usersApi.getMe(),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => usersApi.updateMe(body),
    onSuccess: (data) => {
      updateStoredUser(data.user);
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}

const FALLBACK_ERROR = "Something went wrong. Please try again.";

export function getProfileErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message?.trim();
  if (message && message.length <= 160) return message;
  if (axiosError.response?.status === 400) return "Please enter a valid amount.";
  return FALLBACK_ERROR;
}
