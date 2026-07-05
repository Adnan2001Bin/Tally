import { prisma } from "../../../lib/prisma.js";
import { baseUsernameFrom, withUsernameSuffix } from "../../../lib/username.js";
import type { SessionDeviceMeta } from "../../../models/auth-session.js";
import type { RegisterInput } from "../auth.types.js";
import type { AuthResponse } from "../auth.types.js";
import { AuthError } from "../auth.types.js";
import { mapUniqueConstraintError } from "./errors.service.js";
import { hashPassword } from "./password.service.js";
import { createSession } from "./session.service.js";
import { buildAuthResponse, type SignAccessToken } from "./token.service.js";

async function resolveUsername(
  displayName: string,
  email: string,
  preferred?: string,
): Promise<string> {
  if (preferred) {
    const taken = await prisma.user.findUnique({ where: { username: preferred } });
    if (!taken) return preferred;
    throw new AuthError("That username is already taken", 409, "USERNAME_TAKEN");
  }

  const base = baseUsernameFrom(displayName, email);
  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? "" : String(Math.floor(Math.random() * 9000) + 1000);
    const candidate = suffix ? withUsernameSuffix(base, suffix) : base.slice(0, 30);
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }

  throw new AuthError("Could not create account — try again", 500, "USERNAME_GENERATION_FAILED");
}

export async function registerUser(
  input: RegisterInput,
  deviceMeta: SessionDeviceMeta,
  signAccessToken: SignAccessToken,
): Promise<AuthResponse> {
  const displayName = input.display_name.trim();
  if (displayName.length < 2) {
    throw new AuthError("Enter your full name", 400, "INVALID_DISPLAY_NAME");
  }

  const passwordHash = await hashPassword(input.password);
  const username = await resolveUsername(displayName, input.email, input.username?.trim());

  let user;

  try {
    user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        username,
        display_name: displayName,
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

  const { session, refreshTokenPlain } = await createSession(user!.id, device);
  return buildAuthResponse(user!, refreshTokenPlain, signAccessToken, session.id);
}
