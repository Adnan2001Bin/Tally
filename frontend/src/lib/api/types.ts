/**
 * Friendly API type names for app code.
 */
export type {
  RegisterBody,
  LoginBody,
  RefreshBody,
  LogoutBody,
  AuthResponse,
  ApiError,
  Session,
  User,
  SessionsList,
  SessionDetail,
  RevokeAllSessionsResponse,
  HealthResponse,
  RevokeAllSessionsParams,
} from "./models";

export type {
  RegisterResult,
  LoginResult,
  RefreshResult,
  LogoutResult,
  ListSessionsResult,
  GetSessionResult,
  RevokeAllSessionsResult,
  RevokeSessionResult,
} from "./generated/auth/auth";
