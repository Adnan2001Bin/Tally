export const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
export const usernamePattern = "^[a-zA-Z0-9_]{3,30}$";

export const authTag = "Auth";
export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

/** Short OpenAPI operationIds — Orval uses these for function/type names. */
export const authOperationIds = {
  register: "register",
  login: "login",
  refresh: "refresh",
  logout: "logout",
  listSessions: "listSessions",
  getSession: "getSession",
  revokeAllSessions: "revokeAllSessions",
  revokeSession: "revokeSession",
} as const;

export const schemaRef = {
  registerBody: "RegisterBody",
  loginBody: "LoginBody",
  refreshBody: "RefreshBody",
  logoutBody: "LogoutBody",
  authResponse: "AuthResponse",
  apiError: "ApiError",
  session: "Session",
  sessionsList: "SessionsList",
  revokeAllSessions: "RevokeAllSessionsResponse",
  sessionDetail: "SessionDetail",
  sessionIdParams: "SessionIdParams",
  revokeAllParams: "RevokeAllSessionsParams",
  health: "HealthResponse",
} as const;

export const registerBodySchema = {
  type: "object",
  required: ["email", "password", "username"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 255 },
    password: { type: "string", minLength: 8, maxLength: 128 },
    username: { type: "string", minLength: 3, maxLength: 30, pattern: usernamePattern },
    phone: { type: "string", minLength: 5, maxLength: 20 },
    device_name: { type: "string", maxLength: 255 },
  },
} as const;

export const loginBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1 },
    device_name: { type: "string", maxLength: 255 },
  },
} as const;

export const refreshBodySchema = {
  type: "object",
  required: ["refresh_token"],
  additionalProperties: false,
  properties: {
    refresh_token: { type: "string", minLength: 1 },
  },
} as const;

export const logoutBodySchema = refreshBodySchema;

export const sessionIdParamsSchema = {
  type: "object",
  required: ["sessionId"],
  properties: {
    sessionId: { type: "string", format: "uuid" },
  },
} as const;

export const revokeAllQuerySchema = {
  type: "object",
  properties: {
    keep_current: { type: "boolean", default: true },
  },
} as const;

export const authTokensSchema = {
  type: "object",
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
    expires_in: { type: "number" },
    token_type: { type: "string", enum: ["Bearer"] },
  },
} as const;

export const userPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    phone: { type: ["string", "null"] },
    username: { type: "string" },
    profile_image: { type: ["string", "null"] },
    currency: { type: "string" },
    language: { type: "string" },
    monthly_budget: { type: ["number", "null"] },
    email_verified: { type: "boolean" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
} as const;

export const authResponseSchema = {
  type: "object",
  properties: {
    ...authTokensSchema.properties,
    user: userPublicSchema,
  },
} as const;

export const sessionPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    user_id: { type: "string" },
    device_name: { type: ["string", "null"] },
    ip_address: { type: ["string", "null"] },
    user_agent: { type: ["string", "null"] },
    expires_at: { type: "string", format: "date-time" },
    created_at: { type: "string", format: "date-time" },
  },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    code: { type: "string" },
  },
} as const;
