#!/usr/bin/env bash
# Registers a user against the local fantasy-mcp server and prints the response.
# The token in the response is what /mcp wants as `Authorization: Bearer <token>`.
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"

curl -sS -X POST "http://${HOST}:${PORT}/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alex",
    "lastName": "Haldeman",
    "email": "alxhldmn@gmail.com",
    "sleeperUsername": "ahaldeman"
  }'
echo
