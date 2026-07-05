import type { SessionPublic } from "../../models/auth-session.js";
import type { UserPublic } from "../../models/user.js";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
};

export type AuthResponse = AuthTokens & {
  user: UserPublic;
};

export type { SessionPublic };

export type RegisterInput = {
  email: string;
  password: string;
  display_name: string;
  username?: string;
  phone?: string;
  device_name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
  device_name?: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
