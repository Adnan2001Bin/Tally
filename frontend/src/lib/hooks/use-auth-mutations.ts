import { useMutation } from "@tanstack/react-query";
import { getAuth } from "@/lib/api/generated/auth/auth";
import type { ApiError } from "@/lib/api/types";
import { saveAuthSession } from "@/lib/auth/auth-storage";
import { getDeviceName } from "@/lib/auth/device";
import type { AxiosError } from "axios";

const authApi = getAuth();

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function isSafeUserMessage(message: string): boolean {
  if (message.length > 160) return false;
  // Block stack traces, Prisma dumps, and absolute paths from reaching the UI.
  return !/prisma|invocation|E:\\|\/src\/|at\s+\S+\s+\(|node_modules/i.test(message);
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message?.trim();

  if (message && isSafeUserMessage(message)) {
    return message;
  }

  const status = axiosError.response?.status;
  if (status === 401) return "Invalid email or password.";
  if (status === 409) return "An account with these details already exists.";
  if (status === 400) return "Please check your input and try again.";

  return FALLBACK_ERROR;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authApi.login({
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
      return authApi.register({
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
