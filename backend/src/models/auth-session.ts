import type { AuthSession as PrismaAuthSession } from "@prisma/client";

export type AuthSession = PrismaAuthSession;

/** Session fields safe to return from the API. */
export type SessionPublic = Omit<PrismaAuthSession, "refresh_token">;

export function toPublicSession(session: PrismaAuthSession): SessionPublic {
  const { refresh_token: _, ...publicSession } = session;
  return publicSession;
}

/** Payload used when issuing a new refresh session. */
export type AuthSessionCreateInput = {
  user_id: string;
  refresh_token: string;
  device_name?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: Date;
};

/** Device metadata captured from the incoming request. */
export type SessionDeviceMeta = {
  device_name?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
};
