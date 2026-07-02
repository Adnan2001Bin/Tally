import { useMutation } from "@tanstack/react-query";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { saveAuthSession } from "@/lib/auth/auth-storage";
import { getDeviceName } from "@/lib/auth/device";
import type { PostAuthLogin401 } from "@/lib/api/models";
import type { AxiosError } from "axios";

const authApi = getAuth();

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<PostAuthLogin401>;
  return axiosError.response?.data?.message ?? "Something went wrong. Please try again.";
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authApi.postAuthLogin({
        email,
        password,
        device_name: getDeviceName(),
      });
    },
    onSuccess: saveAuthSession,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username: string;
    }) => {
      return authApi.postAuthRegister({
        email,
        password,
        username,
        device_name: getDeviceName(),
      });
    },
    onSuccess: saveAuthSession,
  });
}

export function useAuthErrorMessage(error: unknown): string | null {
  if (!error) return null;
  return getErrorMessage(error);
}
