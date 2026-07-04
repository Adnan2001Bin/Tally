import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/routes/index.js";
import { expensesRoutes } from "../modules/expenses/routes/index.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(expensesRoutes, { prefix: "/expenses" });
}
