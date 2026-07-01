import { env } from "../../../config/env.js";
import { generateRefreshToken, hashRefreshToken } from "../../../lib/crypto.js";
import { addDuration } from "../../../lib/duration.js";
import { prisma } from "../../../lib/prisma.js";
import type { AuthResponse } from "../auth.types.js";
import { AuthError } from "../auth.types.js";
import {
  assertSessionActive,
  findSessionByRefreshToken,
} from "./session.service.js";
import { buildAuthResponse, type SignAccessToken } from "./token.service.js";

export async function refreshTokens(
  refreshToken: string,
  signAccessToken: SignAccessToken,
): Promise<AuthResponse> {
  const existing = await findSessionByRefreshToken(refreshToken);

  if (!existing) {
    throw new AuthError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  assertSessionActive(existing);

  const newRefreshTokenPlain = generateRefreshToken();
  const newRefreshTokenHash = hashRefreshToken(newRefreshTokenPlain);
  const expiresAt = addDuration(new Date(), env.jwt.refreshExpiresIn);

  const session = await prisma.authSession.update({
    where: { id: existing.id },
    data: {
      refresh_token: newRefreshTokenHash,
      expires_at: expiresAt,
    },
  });

  return buildAuthResponse(
    existing.user,
    newRefreshTokenPlain,
    signAccessToken,
    session.id,
  );
}
