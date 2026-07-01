import { hashRefreshToken } from "../../../lib/crypto.js";
import { prisma } from "../../../lib/prisma.js";

export async function logoutByRefreshToken(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.authSession.deleteMany({
    where: { refresh_token: tokenHash },
  });
}
