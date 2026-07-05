import type { FastifyInstance } from "fastify";
import { meRoutes } from "./me.route.js";

export async function usersRoutes(app: FastifyInstance) {
  meRoutes(app);
}
