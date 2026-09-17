import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getLeaguesForUser, getUserByUsername } from "../../sleeper/client.js";

// Season is a 4-digit NFL year, matching Sleeper's path segment.
const paramsSchema = z.object({
  season: z.string().regex(/^\d{4}$/, "must be a 4-digit year"),
});

const querySchema = z.object({
  username: z.string().trim().min(1),
});

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
}

export function leagueRoutes(app: FastifyInstance): void {
  // Open route: discover a user's leagues (by Sleeper username) before they
  // register. Sleeper's leagues endpoint keys off user_id, so resolve the
  // username to an id first, then fetch. Returns [{ id, name }, ...].
  app.get("/leagues/:season", async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply
        .code(400)
        .send({ error: "Invalid request", issues: formatIssues(params.error) });
    }
    const query = querySchema.safeParse(request.query);
    if (!query.success) {
      return reply
        .code(400)
        .send({ error: "Invalid request", issues: formatIssues(query.error) });
    }

    const sleeperUser = await getUserByUsername(query.data.username);
    if (sleeperUser === null) {
      return reply
        .code(404)
        .send({ error: `Sleeper user "${query.data.username}" not found` });
    }

    const leagues = await getLeaguesForUser(
      sleeperUser.user_id,
      params.data.season,
    );
    return reply.send(
      leagues.map((league) => ({ id: league.league_id, name: league.name })),
    );
  });
}
