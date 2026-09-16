# TypeScript conventions

## Prefer required over optional (tell, don't ask)

Default every parameter, object property, and database column to **required**. Reach for optional or nullable only when absence is a genuine part of the domain at that point in the code.

The anti-pattern to avoid is a `?`-optional standing in for a value that is actually always present. It spreads `undefined`-handling through the codebase and hides the fact that the value is really always there.

- **Function parameters**: no `?`-optional params when every call site has the value. Pass it in.
  - Bad: `createMcpServer(authUser?: AuthUser)` when auth is always enforced first.
  - Good: `createMcpServer(authUser: AuthUser)`.
- **Object / interface properties**: no `foo?: T` when `foo` is always set. Make it `foo: T`.
- **Prisma columns**: no `field String?` when the field is always populated. Make it `field String` (backfill a fallback at write time rather than storing null).

### Allowed exception: real absence, as a return or an input union

When a value genuinely may be absent, model it explicitly — and prefer a nullable **return** or an honest **input union** over a `?`-optional:

- Return `T | null` for a lookup that can miss: `getUserByUsername(name): Promise<SleeperUser | null>`.
- Take `string | undefined` for an input that may not exist: `authenticateRequest(header: string | undefined)` — an HTTP header can be missing. This is a required positional whose type admits absence, not a `?`-optional the caller can drop.

The test: at this line, is the value always available? If yes, required. If no, model the absence with `| null` / `| undefined`, not with `?`.
