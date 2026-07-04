import type { FastifyInstance } from "fastify";
import { createExpenseRoute } from "./create.route.js";
import { deleteExpenseRoute } from "./delete.route.js";
import { getExpenseRoute } from "./get.route.js";
import { listExpensesRoute } from "./list.route.js";
import { updateExpenseRoute } from "./update.route.js";

export async function expensesRoutes(app: FastifyInstance) {
  createExpenseRoute(app);
  listExpensesRoute(app);
  getExpenseRoute(app);
  updateExpenseRoute(app);
  deleteExpenseRoute(app);
}
