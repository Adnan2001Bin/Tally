import { useMutation } from "@tanstack/react-query";
import { getAuth } from "@/lib/api/generated/auth/auth";
import type { ApiError } from "@/lib/api/types";
import { saveAuthSession } from "@/lib/auth/auth-storage";
import { getDeviceName } from "@/lib/auth/device";
import { validateLoginInput, validateRegisterInput } from "@/lib/auth/validate-auth";
import type { AxiosError } from "axios";

const authApi = getAuth();

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function isSafeUserMessage(message: string): boolean {
  if (message.length > 160) return false;
  // Block stack traces, Prisma dumps, and absolute paths from reaching the UI.
  return !/prisma|invocation|E:\\|\/src\/|at\s+\S+\s+\(|node_modules/i.test(message);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && (error as Error & { isValidationError?: boolean }).isValidationError) {
    return error.message;
  }

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
      const validationError = validateLoginInput({ email, password });
      if (validationError) {
        throw Object.assign(new Error(validationError), { isValidationError: true });
      }
      return authApi.login({
        email: email.trim().toLowerCase(),
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
      display_name,
    }: {
      email: string;
      password: string;
      display_name: string;
    }) => {
      const validationError = validateRegisterInput({ email, password, display_name });
      if (validationError) {
        throw Object.assign(new Error(validationError), { isValidationError: true });
      }
      return authApi.register({
        email: email.trim().toLowerCase(),
        password,
        display_name: display_name.trim(),
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
