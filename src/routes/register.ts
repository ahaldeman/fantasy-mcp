import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { apiKeyPrefix, generateApiKey, hashApiKey } from "../auth/apiKey.js";
import { prisma } from "../db/client.js";
import { getUserByUsername } from "../sleeper/client.js";

const registerBody = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  // Trim + lowercase first, then validate the cleaned value as an email.
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.email()),
  sleeperUsername: z.string().trim().min(1),
});

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}

export function registerRoutes(app: FastifyInstance): void {
  app.post("/register", async (request, reply) => {
    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid request", issues: formatIssues(parsed.error) });
    }
    const { firstName, lastName, email, sleeperUsername } = parsed.data;

    const sleeperUser = await getUserByUsername(sleeperUsername);
    if (sleeperUser === null) {
      return reply
        .code(422)
        .send({ error: `Sleeper user "${sleeperUsername}" not found` });
    }

    // Clear, field-specific conflict before we try to write.
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { sleeperUserId: sleeperUser.user_id }],
      },
    });
    if (existing !== null) {
      const field = existing.email === email ? "email" : "Sleeper user";
      return reply.code(409).send({ error: `A user with this ${field} already exists` });
    }

    const apiKey = generateApiKey();

    try {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          sleeperUserId: sleeperUser.user_id,
          sleeperUsername: sleeperUser.username,
          displayName: sleeperUser.display_name || sleeperUser.username,
          apiKeyHash: hashApiKey(apiKey),
          apiKeyPrefix: apiKeyPrefix(apiKey),
        },
      });

      return reply.code(201).send({
        apiKey,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          sleeperUserId: user.sleeperUserId,
          sleeperUsername: user.sleeperUsername,
          displayName: user.displayName,
        },
      });
    } catch (err) {
      // Race-safe backstop: a concurrent request may have inserted first.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return reply.code(409).send({ error: "A user with this email or Sleeper user already exists" });
      }
      throw err;
    }
  });
}
