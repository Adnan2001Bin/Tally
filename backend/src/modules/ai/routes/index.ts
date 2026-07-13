import type { FastifyInstance } from "fastify";
import { parseExpenseRoute } from "./parse-expense.route.js";
import { parseStatusRoute } from "./parse-status.route.js";

export async function aiRoutes(app: FastifyInstance) {
  parseStatusRoute(app);
  parseExpenseRoute(app);
}
