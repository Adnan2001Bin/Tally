import type { User as PrismaUser } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

/** Public user fields — never expose password_hash. */
export type UserPublic = Omit<PrismaUser, "password_hash" | "monthly_budget"> & {
  monthly_budget: number | null;
};

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
    "phone" | "username" | "profile_image" | "currency" | "language" | "monthly_budget"
  >
>;

function toBudgetNumber(value: Decimal | null): number | null {
  if (value === null) return null;
  return Number(value.toFixed(2));
}

export function toPublicUser(user: PrismaUser): UserPublic {
  const { password_hash: _, monthly_budget, ...rest } = user;
  return {
    ...rest,
    monthly_budget: toBudgetNumber(monthly_budget),
  };
}
