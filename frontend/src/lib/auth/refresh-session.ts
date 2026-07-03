import { getAuth } from "@/lib/api/generated/auth/auth";
import {
  clearAuthSession,
  getRefreshToken,
  saveAuthSession,
} from "@/lib/auth/auth-storage";

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      return false;
    }

    try {
      const result = await getAuth().refresh({ refresh_token: refreshToken });
      saveAuthSession(result);
      return true;
    } catch {
      clearAuthSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
