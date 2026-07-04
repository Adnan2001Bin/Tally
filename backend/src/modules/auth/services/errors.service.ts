import { Prisma } from "@prisma/client";
import { AuthError } from "../auth.types.js";

export function mapUniqueConstraintError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [];

    if (fields.includes("email")) {
      throw new AuthError("An account with this email already exists", 409, "DUPLICATE_EMAIL");
    }
    if (fields.includes("username")) {
      throw new AuthError("This username is already taken", 409, "DUPLICATE_USERNAME");
    }

    throw new AuthError("An account with these details already exists", 409, "DUPLICATE");
  }

  throw error;
}
