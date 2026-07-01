import { prisma } from "../../../lib/prisma.js";
import type { SessionDeviceMeta } from "../../../models/auth-session.js";
import type { RegisterInput } from "../auth.types.js";
import type { AuthResponse } from "../auth.types.js";
import { mapUniqueConstraintError } from "./errors.service.js";
import { hashPassword } from "./password.service.js";
import { createSession } from "./session.service.js";
import { buildAuthResponse, type SignAccessToken } from "./token.service.js";

export async function registerUser(
  input: RegisterInput,
  deviceMeta: SessionDeviceMeta,
  signAccessToken: SignAccessToken,
): Promise<AuthResponse> {
  const passwordHash = await hashPassword(input.password);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        username: input.username,
        phone: input.phone ?? null,
      },
    });
  } catch (error) {
    mapUniqueConstraintError(error);
  }

  const device = {
    ...deviceMeta,
    device_name: input.device_name ?? deviceMeta.device_name ?? null,
  };

  const { session, refreshTokenPlain } = await createSession(user.id, device);
  return buildAuthResponse(user, refreshTokenPlain, signAccessToken, session.id);
}
