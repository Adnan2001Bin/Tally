import { prisma } from "../../../lib/prisma.js";
import type { SessionDeviceMeta } from "../../../models/auth-session.js";
import type { AuthResponse, LoginInput } from "../auth.types.js";
import { AuthError } from "../auth.types.js";
import { verifyPassword } from "./password.service.js";
import { createSession } from "./session.service.js";
import { buildAuthResponse, type SignAccessToken } from "./token.service.js";

export async function loginUser(
  input: LoginInput,
  deviceMeta: SessionDeviceMeta,
  signAccessToken: SignAccessToken,
): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const device = {
    ...deviceMeta,
    device_name: input.device_name ?? deviceMeta.device_name ?? null,
  };

  const { session, refreshTokenPlain } = await createSession(user.id, device);
  return buildAuthResponse(user, refreshTokenPlain, signAccessToken, session.id);
}
