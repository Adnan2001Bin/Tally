import type { User as PrismaUser } from "@prisma/client";

/** Public user fields — never expose password_hash. */
export type UserPublic = Omit<PrismaUser, "password_hash">;

/** Fields required to create a new user account. */
export type UserCreateInput = {
  email: string;
  password_hash: string;
  username: string;
  phone?: string | null;
  profile_image?: string | null;
  currency?: string;
  language?: string;
};

/** Fields a user may update on their own profile. */
export type UserUpdateInput = Partial<
  Pick<
    PrismaUser,
    "phone" | "username" | "profile_image" | "currency" | "language"
  >
>;

export function toPublicUser(user: PrismaUser): UserPublic {
  const { password_hash: _, ...publicUser } = user;
  return publicUser;
}
