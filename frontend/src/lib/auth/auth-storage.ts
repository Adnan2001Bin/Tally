import type { AuthResponse } from "@/lib/api/types";

const ACCESS_TOKEN_KEY = "tally_access_token";
const REFRESH_TOKEN_KEY = "tally_refresh_token";
const USER_KEY = "tally_user";

export type AuthSession = AuthResponse;

export function saveAuthSession(response: AuthSession): void {
  const { access_token, refresh_token, user } = response;
  if (!access_token || !refresh_token) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession["user"];
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
