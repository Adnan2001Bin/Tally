import { Prisma } from "@prisma/client";
import { AuthError } from "../auth.types.js";

export function mapUniqueConstraintError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.join(", ") : "field";
    throw new AuthError(`A record with this ${fields} already exists`, 409, "DUPLICATE");
  }

  throw error;
}
