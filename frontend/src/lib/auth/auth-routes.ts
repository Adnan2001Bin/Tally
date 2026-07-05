export const AUTH_ROUTES = {
  home: "/",
  login: "/login",
  app: "/app",
} as const;

export function groupInvitePath(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/^TALLY-/i, "");
  return `/group/join?code=${encodeURIComponent(normalized)}`;
}

export function redirectToLogin(joinCode?: string): void {
  const url = joinCode
    ? `${AUTH_ROUTES.login}?join=${encodeURIComponent(joinCode)}`
    : AUTH_ROUTES.login;
  window.location.href = url;
}

export function redirectToApp(joinCode?: string): void {
  const url = joinCode
    ? `${AUTH_ROUTES.app}?join=${encodeURIComponent(joinCode)}`
    : AUTH_ROUTES.app;
  window.location.href = url;
}
