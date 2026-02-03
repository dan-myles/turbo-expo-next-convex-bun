# Backend Guidelines (Convex + Effect)

This extends the root `AGENTS.md` with backend-specific rules.

## Runtime Information

- **Framework**: Convex with TypeScript
- **Architecture**: Effect for business logic + zodvex for Convex boundary
- **Errors**: `Data.TaggedError` in `errors/`
- **Imports**: Use `#backend/*` for internal imports

## Available Commands

- **Build**: `bun run build`
- **Dev**: `bun run dev`
- **Typecheck**: `bun run typecheck`
- **Test**: `bun run test`
- **Format**: `bun run format` (check)
- **Format Fix**: `bun run format:fix`
- **Lint**: `bun run lint` (check)
- **Lint Fix**: `bun run lint:fix`
- **Clean**: `bun run clean`

## Non-Negotiables

- **File naming**: `snake_case` only
- **Public endpoints**: zodvex builders with Zod schemas for args + returns
- **Internal endpoints**: Convex `v` validators
- **Business logic**: Effect modules only (no logic in handlers)
- **Errors**: `Data.TaggedError` + `Effect.tryPromise` mapping
- **Handlers**: thin wiring with `Effect.provide(...).runPromise`

## Canonical Structure

```
packages/backend/src/
├── errors/            # Tagged errors
├── functions/         # Convex handlers
├── http/              # HTTP example endpoints
├── lib/               # middleware + validators barrel
├── modules/           # Effect + validators
├── services/          # Effect context services
├── tables/            # zodTable definitions
├── schema.ts
└── http.ts
```

## Endpoint Pattern (3 Files)

```
modules/{domain}/
├── {fn}.validators.ts   # Zod schemas + types
├── {fn}.ts              # Effect business logic
└── {fn}.test.ts          # Optional tests

functions/
└── {domain}.ts           # Convex handler wiring
```

## Notes

- Keep `packages/backend/ARCHITECTURE.md` as the authoritative design reference.
- Do not reintroduce legacy `modules/*/queries.ts` or `modules/*/mutations.ts` patterns.
