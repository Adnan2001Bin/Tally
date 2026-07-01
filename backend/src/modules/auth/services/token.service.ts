import { env } from "../../../config/env.js";
import { parseDurationToSeconds } from "../../../lib/duration.js";
import { toPublicUser } from "../../../models/user.js";
import type { AuthResponse } from "../auth.types.js";

export type SignAccessToken = (payload: { sub: string; sid: string }) => string;

export function buildAuthResponse(
  user: Parameters<typeof toPublicUser>[0],
  refreshTokenPlain: string,
  signAccessToken: SignAccessToken,
  sessionId: string,
): AuthResponse {
  return {
    access_token: signAccessToken({ sub: user.id, sid: sessionId }),
    refresh_token: refreshTokenPlain,
    expires_in: parseDurationToSeconds(env.jwt.accessExpiresIn),
    token_type: "Bearer",
    user: toPublicUser(user),
  };
}
