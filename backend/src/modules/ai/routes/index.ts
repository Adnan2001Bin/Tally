import type { FastifyInstance } from "fastify";
import { parseExpenseRoute } from "./parse-expense.route.js";

export async function aiRoutes(app: FastifyInstance) {
  parseExpenseRoute(app);
}
