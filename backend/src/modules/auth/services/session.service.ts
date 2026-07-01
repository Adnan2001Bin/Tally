import { env } from "../../../config/env.js";
import { generateRefreshToken, hashRefreshToken } from "../../../lib/crypto.js";
import { addDuration } from "../../../lib/duration.js";
import { prisma } from "../../../lib/prisma.js";
import type { SessionDeviceMeta } from "../../../models/auth-session.js";
import { toPublicSession, type SessionPublic } from "../../../models/auth-session.js";
import { AuthError } from "../auth.types.js";

export async function findSessionByRefreshToken(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  return prisma.authSession.findUnique({
    where: { refresh_token: tokenHash },
    include: { user: true },
  });
}

export async function createSession(
  userId: string,
  deviceMeta: SessionDeviceMeta,
): Promise<{ session: SessionPublic; refreshTokenPlain: string }> {
  const refreshTokenPlain = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshTokenPlain);
  const expiresAt = addDuration(new Date(), env.jwt.refreshExpiresIn);

  const session = await prisma.authSession.create({
    data: {
      user_id: userId,
      refresh_token: refreshTokenHash,
      device_name: deviceMeta.device_name ?? null,
      ip_address: deviceMeta.ip_address ?? null,
      user_agent: deviceMeta.user_agent ?? null,
      expires_at: expiresAt,
    },
  });

  return {
    session: toPublicSession(session),
    refreshTokenPlain,
  };
}

export function assertSessionActive(session: { expires_at: Date }): void {
  if (session.expires_at <= new Date()) {
    throw new AuthError("Refresh session has expired", 401, "SESSION_EXPIRED");
  }
}

export async function listUserSessions(userId: string): Promise<SessionPublic[]> {
  const sessions = await prisma.authSession.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return sessions.map(toPublicSession);
}

export async function getUserSession(
  userId: string,
  sessionId: string,
): Promise<SessionPublic> {
  const session = await prisma.authSession.findFirst({
    where: {
      id: sessionId,
      user_id: userId,
    },
  });

  if (!session) {
    throw new AuthError("Session not found", 404, "SESSION_NOT_FOUND");
  }

  return toPublicSession(session);
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<void> {
  const result = await prisma.authSession.deleteMany({
    where: {
      id: sessionId,
      user_id: userId,
    },
  });

  if (result.count === 0) {
    throw new AuthError("Session not found", 404, "SESSION_NOT_FOUND");
  }
}

export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<number> {
  const result = await prisma.authSession.deleteMany({
    where: {
      user_id: userId,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
  });

  return result.count;
}

export async function assertActiveSessionForUser(
  userId: string,
  sessionId: string,
): Promise<void> {
  const session = await prisma.authSession.findFirst({
    where: {
      id: sessionId,
      user_id: userId,
    },
  });

  if (!session) {
    throw new AuthError("Session not found or revoked", 401, "SESSION_REVOKED");
  }

  assertSessionActive(session);
}
