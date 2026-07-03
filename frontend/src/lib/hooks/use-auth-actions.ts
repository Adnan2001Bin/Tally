import { useMutation, useQuery } from "@tanstack/react-query";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { redirectToLogin } from "@/lib/auth/auth-routes";
import { clearAuthSession, getRefreshToken } from "@/lib/auth/auth-storage";

const authApi = getAuth();

export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await authApi.logout({ refresh_token: refreshToken });
        } catch {
          // Clear local session even if the server call fails.
        }
      }
      clearAuthSession();
    },
    onSuccess: () => {
      redirectToLogin();
    },
  });
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => authApi.listSessions(),
  });
}
