export const AUTH_ROUTES = {
  home: "/",
  login: "/login",
  app: "/app",
} as const;

export function redirectToLogin(): void {
  window.location.href = AUTH_ROUTES.login;
}

export function redirectToApp(): void {
  window.location.href = AUTH_ROUTES.app;
}
