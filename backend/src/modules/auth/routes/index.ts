import type { FastifyInstance } from "fastify";
import { signAccessToken } from "../utils/route-helpers.js";
import { loginRoute } from "./login.route.js";
import { logoutRoute } from "./logout.route.js";
import { refreshRoute } from "./refresh.route.js";
import { registerRoute } from "./register.route.js";
import { sessionsRoutes } from "./sessions.route.js";

export async function authRoutes(app: FastifyInstance) {
  const signToken = signAccessToken(app);

  registerRoute(app, signToken);
  loginRoute(app, signToken);
  refreshRoute(app, signToken);
  logoutRoute(app);
  sessionsRoutes(app);
}
