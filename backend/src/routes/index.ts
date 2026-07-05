import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/routes/index.js";
import { expensesRoutes } from "../modules/expenses/routes/index.js";
import { groupsRoutes } from "../modules/groups/routes/index.js";
import { usersRoutes } from "../modules/users/routes/index.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(expensesRoutes, { prefix: "/expenses" });
  await app.register(groupsRoutes, { prefix: "/groups" });
  await app.register(usersRoutes, { prefix: "/users" });
}
