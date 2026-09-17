#!/usr/bin/env bash
# Registers a user against the local fantasy-mcp server and prints the response.
# It first asks our own /leagues endpoint for the user's leagues, takes the
# first one, and registers with that league id. The token in the response is
# what /mcp wants as `Authorization: Bearer <token>`.
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
BASE="http://${HOST}:${PORT}"
USERNAME="${SLEEPER_USERNAME:-ahaldeman}"
SEASON="${SEASON:-2026}"

# Find the user's leagues via our own API, then take the first one.
leagues=$(curl -sS "${BASE}/leagues/${SEASON}?username=${USERNAME}")
league_id=$(echo "${leagues}" | jq -r '.[0].id // empty')

if [ -z "${league_id}" ]; then
  echo "No leagues found for ${USERNAME} in ${SEASON}. Response: ${leagues}" >&2
  exit 1
fi

# Diagnostics to stderr so stdout stays just the register response.
echo "Using league ${league_id} ($(echo "${leagues}" | jq -r '.[0].name // "?"'))" >&2

curl -sS -X POST "${BASE}/register" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg username "${USERNAME}" \
    --arg leagueId "${league_id}" \
    '{
      firstName: "Alex",
      lastName: "Haldeman",
      email: "alxhldmn@gmail.com",
      sleeperUsername: $username,
      sleeperLeagueId: $leagueId
    }')"
echo
