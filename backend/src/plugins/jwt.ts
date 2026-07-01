import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config/env.js";

export default fp(async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.jwt.accessSecret,
    sign: {
      expiresIn: env.jwt.accessExpiresIn,
    },
  });
});
