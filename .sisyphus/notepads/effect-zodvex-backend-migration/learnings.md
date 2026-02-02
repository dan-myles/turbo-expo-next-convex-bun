# Learnings - Effect + Zodvex Backend Migration

## [2026-02-02T02:15:00Z] Gamestock v2 Patterns Documented

### Service Layer Pattern (Context.Tag + Layer)

**Pattern**: Each service is a Context.Tag with a static `live` method that creates a Layer.

```typescript
// services/ctx.ts - Wraps full Convex contexts
import { Context, Layer } from "effect"
import type { PublicQueryCtx } from "#backend/lib/middleware.ts"

export class Query extends Context.Tag("Query")<Query, PublicQueryCtx>() {
  static live = (ctx: PublicQueryCtx) => Layer.succeed(Query, ctx)
}
```

**Key Services**:
- `Query`, `Mutation`, `Action` - Public contexts
- `AuthQuery`, `AuthMutation` - Authenticated contexts  
- `AdminQuery`, `AdminMutation` - Admin contexts
- `InternalQuery`, `InternalMutation`, `InternalAction` - Internal contexts

**Legacy Services** (still used but deprecated):
- `Db` / `DbWriter` - Database reader/writer
- `Auth` - User document
- `Storage` - Storage reader

### Error Taxonomy Pattern (Data.TaggedError)

**Pattern**: Errors extend `Data.TaggedError` with typed properties.

```typescript
// errors/common.ts - Internal errors
import { Data } from "effect"

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string
  cause?: unknown
}> {}
```

```typescript
// errors/user.ts - User-facing errors with userMessage
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId?: Id<"users">
  userMessage: string
}> {
  constructor(props?: { userId?: Id<"users"> }) {
    super({ userId: props?.userId, userMessage: "User not found" })
  }
}
```

**Key Distinction**:
- Internal errors: `DatabaseError`, `StorageError` - logged server-side
- User-facing errors: Include `userMessage` field for client display

### Module Pattern (3-file structure)

**Pattern**: Each endpoint = validators + effect + handler wiring

```
modules/user/
  history.validators.ts  # Zod schemas for args/returns
  history.ts             # Effect with business logic
  history.test.ts        # Unit tests (optional)
  
functions/
  user.ts                # Handler wiring
```

**Validators File** (`*.validators.ts`):
```typescript
import { z } from "zod"
import { zid } from "zodvex"

export const historyArgsSchema = z.object({
  userId: zid("users").optional(),
  filter: z.enum(["all", "upcoming", "active", "past"]).optional(),
})

export type HistoryArgs = z.infer<typeof historyArgsSchema>

export const historyItemSchema = z.object({
  id: z.union([zid("leagues"), zid("challenges")]),
  name: z.string(),
  status: z.enum(["win", "loss"]),
  // ... more fields
})

export const historyResultSchema = z.array(historyItemSchema)

export type HistoryItem = z.infer<typeof historyItemSchema>
export type HistoryResult = z.infer<typeof historyResultSchema>
```

**Effect Module** (`*.ts`):
```typescript
import { Effect } from "effect"
import type { HistoryArgs, HistoryResult } from "./history.validators.ts"
import { DatabaseError } from "#backend/v2/errors/index.ts"
import { AuthQuery } from "#backend/v2/services/index.ts"

export const history = Effect.fn("user.history")(function* (args: HistoryArgs) {
  const { db, user } = yield* AuthQuery
  
  const data = yield* Effect.tryPromise({
    try: () => db.query("items").collect(),
    catch: (e) => new DatabaseError({ operation: "query:items", cause: e }),
  })
  
  return data satisfies HistoryResult
})
```

**Handler Wiring** (`functions/*.ts`):
```typescript
import { Effect } from "effect"
import { authQuery } from "#backend/v2/lib/middleware.ts"
import { history as historyEffect } from "#backend/v2/modules/user/history.ts"
import { historyArgsSchema, historyResultSchema } from "#backend/v2/modules/user/history.validators.ts"
import { AuthQuery } from "#backend/v2/services/index.ts"

export const history = authQuery({
  args: historyArgsSchema,
  returns: historyResultSchema,
  handler: (ctx, args) =>
    historyEffect(args).pipe(
      Effect.provide(AuthQuery.live(ctx)),
      Effect.runPromise,
    ),
})
```

### Middleware Pattern (zodvex + custom ctx)

**Pattern**: Extended middleware with auth/admin variants

```typescript
// lib/middleware.ts
import type { ExtractCtx } from "zodvex"
import { customCtx, zCustomQueryBuilder, zCustomMutationBuilder } from "zodvex"

export const authQuery = zCustomQueryBuilder(
  convexQuery,
  customCtx(async (ctx: QueryCtx): Promise<{ user: Doc<"users"> }> => {
    const user = await userFromCtx(ctx)
    return { user }
  }),
)

export type AuthQueryCtx = ExtractCtx<typeof authQuery>
```

### Validators Barrel Export Pattern

**Pattern**: Re-export all validators for frontend consumption

```typescript
// lib/validators.ts
export {
  historyArgsSchema,
  historyItemSchema,
  historyResultSchema,
  type HistoryArgs,
  type HistoryItem,
  type HistoryResult,
} from "#backend/v2/modules/user/history.validators.ts"
```

Frontend imports: `import { type HistoryItem } from "@acme/backend/validators"`

### HTTP Pattern (Hono + typed errors)

**Pattern**: HTTP errors with conversion helper

```typescript
// http/http_errors.ts
import { Data } from "effect"

export class BadRequest extends Data.TaggedError("BadRequest")<{
  message?: string
}> {}

export const errorToResponse = (error: unknown): Response => {
  if (error instanceof BadRequest) {
    return Response.json({ message: error.message }, { status: 400 })
  }
  // ... other error types
  return Response.json({ message: "Internal server error" }, { status: 500 })
}
```

### Naming Conventions

- **Files**: `snake_case` for all backend files
- **Validators**: `{function}ArgsSchema`, `{function}ItemSchema`, `{function}ResultSchema`
- **Types**: `{Function}Args`, `{Function}Item`, `{Function}Result` (PascalCase)
- **Effect functions**: `Effect.fn("domain.function")` with span name for tracing
- **Services**: PascalCase class names (`Query`, `AuthQuery`, `Db`)

### Effect Patterns

**Parallel queries**:
```typescript
const [users, items] = yield* Effect.all(
  [
    Effect.tryPromise({
      try: () => db.query("users").collect(),
      catch: (e) => new DatabaseError({ operation: "query:users", cause: e }),
    }),
    Effect.tryPromise({
      try: () => db.query("items").collect(),
      catch: (e) => new DatabaseError({ operation: "query:items", cause: e }),
    }),
  ],
  { concurrency: "unbounded" },
)
```

**Early returns**:
```typescript
if (items.length === 0) {
  return [] satisfies ResultType
}
```

**Maps for O(1) lookups**:
```typescript
const itemMap = new Map(items.map((item) => [item._id, item]))
```

### Dependencies Required

From gamestock `package.json`:
```json
{
  "dependencies": {
    "effect": "catalog:effect",
    "hono": "^4.7.4"
  },
  "devDependencies": {
    "@effect/vitest": "catalog:effect"
  }
}
```

Note: `catalog:effect` needs to be resolved to actual version from workspace catalog.

## Effect & Hono Dependencies Added (2026-02-01)

### Changes Made
- Added `effect@^3.11.9` to dependencies
- Added `hono@^4.7.4` to dependencies
- Added `@effect/vitest@^0.16.0` to devDependencies (note: v0.15.3 doesn't exist)
- Added `vitest@catalog:vite` to devDependencies

### Version Notes
- Effect: Using latest stable v3.11.9
- Hono: Using v4.7.4 (latest stable)
- @effect/vitest: v0.16.0 (v0.15.3 not available in npm registry)
- vitest: Using existing catalog version (^4.0.16)

### Verification
- ✅ `bun install` completed successfully
- ✅ `bun run typecheck` passed (7 successful, 7 total)
- ✅ No TypeScript errors in backend package

### Next Steps
- Ready for Effect-based implementation in backend
- Hono can be used for HTTP endpoints if needed
- vitest + @effect/vitest ready for Effect-based testing

## Directory Structure Migration (2026-02-01)

### Completed
- Created 4 new directories: `services/`, `errors/`, `functions/`, `http/`
- All existing files already follow `snake_case` naming convention
- No import updates needed - files were already properly named
- Typecheck passes successfully

### Key Findings
- Backend codebase already adheres to `snake_case` naming standards
- Existing structure:
  - `lib/` - middleware, errors, logger, env utilities
  - `modules/task/` - queries and mutations
  - `tables/` - task definitions
  - `schema.ts` - root schema definition
- New directories ready for subsequent migration tasks

### Next Steps
- Migrate files into appropriate new directories based on functionality
- Update imports as files are moved

## Effect Service Layer Implementation (2026-02-02)

### Services Created

**`packages/backend/src/services/ctx.ts`**:
- Implemented `Query`, `Mutation`, `Action` services using Effect's `Context.Tag`
- Each service wraps the corresponding Convex context type from middleware
- Each service has a static `live` method that creates a `Layer.succeed` for dependency injection
- Pattern matches gamestock v2 exactly

**`packages/backend/src/services/index.ts`**:
- Barrel export for all three services
- Enables clean imports: `import { Query, Mutation, Action } from "#backend/services"`

### Middleware Updates

**`packages/backend/src/lib/middleware.ts`**:
- Added `ExtractCtx` import from zodvex
- Exported three context types:
  - `PublicQueryCtx = ExtractCtx<typeof query>`
  - `PublicMutationCtx = ExtractCtx<typeof mutation>`
  - `PublicActionCtx = ExtractCtx<typeof action>`
- These types are extracted from the zodvex builders and represent the full Convex context

### Key Pattern Details

**Context.Tag Pattern**:
```typescript
export class Query extends Context.Tag("Query")<Query, PublicQueryCtx>() {
  static live = (ctx: PublicQueryCtx) => Layer.succeed(Query, ctx)
}
```

- First type parameter: the class itself (Query)
- Second type parameter: the value type (PublicQueryCtx)
- `static live` method creates a Layer for dependency injection
- Can be used in Effect with `yield* Query` to access the context

### Verification

- ✅ `bun run typecheck --filter @acme/backend` passes
- ✅ All three services properly typed
- ✅ Barrel export works correctly
- ✅ No TypeScript errors in new files

### Next Steps

- Ready to implement Effect-based modules using these services
- Can now use `yield* Query`, `yield* Mutation`, `yield* Action` in Effect functions
- Services can be provided via `Effect.provide(Query.live(ctx))`
