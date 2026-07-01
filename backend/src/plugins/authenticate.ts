import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify) => {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ error: "Unauthorized", message: "Invalid or expired access token" });
      }
    },
  );
});
