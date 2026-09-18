import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authenticateRequest, type AuthUser } from "./authenticate.js";
import { issueToken } from "./token.js";
import { prisma } from "../../db/client.js";
import { getLeagueUsers, getUserByUsername } from "../../sleeper/client.js";

const registerBody = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  // Trim + lowercase first, then validate the cleaned value as an email.
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.email()),
  sleeperUsername: z.string().trim().min(1),
  sleeperLeagueId: z.string().trim().min(1),
});

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}

export function authRoutes(app: FastifyInstance): void {
  app.post("/register", async (request, reply) => {
    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid request", issues: formatIssues(parsed.error) });
    }
    const { firstName, lastName, email, sleeperUsername, sleeperLeagueId } =
      parsed.data;

    const sleeperUser = await getUserByUsername(sleeperUsername);
    if (sleeperUser === null) {
      return reply
        .code(422)
        .send({ error: `Sleeper user "${sleeperUsername}" not found` });
    }

    // The league must exist and the user must be a member of it, so every
    // league-scoped tool later resolves their roster by owner_id.
    const leagueMembers = await getLeagueUsers(sleeperLeagueId);
    const isMember = leagueMembers.some(
      (member) => member.user_id === sleeperUser.user_id,
    );
    if (!isMember) {
      return reply.code(422).send({
        error: `Sleeper user "${sleeperUsername}" is not a member of league "${sleeperLeagueId}"`,
      });
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

    try {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          sleeperUserId: sleeperUser.user_id,
          sleeperUsername: sleeperUser.username,
          sleeperLeagueId,
          displayName: sleeperUser.display_name || sleeperUser.username,
        },
      });

      const authUser: AuthUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sleeperUserId: user.sleeperUserId,
        sleeperUsername: user.sleeperUsername,
        sleeperLeagueId: user.sleeperLeagueId,
        displayName: user.displayName,
      };
      const token = await issueToken(authUser);

      return reply.code(201).send({ token, user: authUser });
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

  app.get("/me", async (request, reply) => {
    const user = await authenticateRequest(request.headers.authorization);
    if (user === null) {
      return reply
        .code(401)
        .header("WWW-Authenticate", "Bearer")
        .send({ error: "Unauthorized" });
    }
    return reply.send({ user });
  });
}
