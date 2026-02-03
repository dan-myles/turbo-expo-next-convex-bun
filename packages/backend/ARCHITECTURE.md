# Convex Backend Architecture (Effect + Zodvex)

This document defines the canonical backend architecture and patterns for `packages/backend`.

## Goals

- Keep Convex boundary validation strict with zodvex
- Keep business logic in Effect modules
- Keep handler wiring thin and consistent
- Keep file naming `snake_case`

## Directory Structure

```
packages/backend/src/
├── _generated/              # Auto-generated Convex types (never edit)
├── errors/                  # Tagged errors (Data.TaggedError)
│   ├── common.ts
│   └── index.ts
├── functions/               # Convex handlers (API endpoints)
│   └── task.ts
├── http/                    # HTTP endpoints (Hono + httpAction)
│   ├── http_errors.ts
│   └── router.ts
├── lib/
│   ├── middleware.ts        # zodvex builders + ctx helpers
│   └── validators.ts        # Barrel export for frontend
├── modules/                 # Business logic (Effect + validators)
│   └── task/
│       ├── list.validators.ts
│       ├── list.ts
│       ├── create.validators.ts
│       ├── create.ts
│       ├── toggle.validators.ts
│       ├── toggle.ts
│       ├── remove.validators.ts
│       └── remove.ts
├── services/                # Effect context services (DI)
│   ├── ctx.ts
│   └── index.ts
├── tables/                  # zodTable definitions
│   └── tasks.ts
├── schema.ts                # Convex schema
└── http.ts                  # Convex HTTP entrypoint
```

## Core Pattern: Validators -> Effect -> Handler

Each endpoint consists of three files:

```
modules/{domain}/
├── {function}.validators.ts   # Zod schemas for args and returns
├── {function}.ts              # Effect with business logic
└── {function}.test.ts         # Optional tests

functions/
└── {domain}.ts                # Handler wiring (zodvex + Effect)
```

### Validators (zodvex boundary)

Use Zod schemas for args and returns. Export inferred types.

```typescript
import { z } from "zod"
import { zid } from "zodvex"

export const listArgsSchema = z.object({})
export type ListArgs = z.infer<typeof listArgsSchema>

export const listResultSchema = z.array(
  z.object({
    _id: zid("tasks"),
    text: z.string(),
    completed: z.boolean(),
    createdAt: z.number(),
  }),
)
export type ListResult = z.infer<typeof listResultSchema>
```

### Effect Module (business logic)

```typescript
import { Effect } from "effect"

import type { ListArgs, ListResult } from "./list.validators"

import { DatabaseError } from "#backend/errors"
import { Query } from "#backend/services"

export const list = Effect.fn("task.list")(function* (_args: ListArgs) {
  const { db } = yield* Query

  const tasks = yield* Effect.tryPromise({
    try: () => db.query("tasks").order("desc").collect(),
    catch: (e) => new DatabaseError({ operation: "query:tasks", cause: e }),
  })

  return tasks satisfies ListResult
})
```

### Handler (Convex endpoint)

```typescript
import { Effect } from "effect"

import { query } from "#backend/lib/middleware"
import { list as listEffect } from "#backend/modules/task/list"
import { listArgsSchema, listResultSchema } from "#backend/modules/task/list.validators"
import { Query } from "#backend/services"

export const list = query({
  args: listArgsSchema,
  returns: listResultSchema,
  handler: (ctx) =>
    listEffect({}).pipe(
      Effect.provide(Query.live(ctx)),
      Effect.runPromise,
    ),
})
```

## Services (Context.Tag + Layer)

All Convex context access goes through Effect services in `services/ctx.ts`.

```typescript
export class Query extends Context.Tag("Query")<Query, PublicQueryCtx>() {
  static live = (ctx: PublicQueryCtx) => Layer.succeed(Query, ctx)
}
```

Use `yield* Query` or `yield* Mutation` to access context and `Effect.provide` in handlers.

## Errors (Data.TaggedError)

Errors are typed and composable in `errors/common.ts`.

```typescript
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string
  cause?: unknown
}> {}
```

Use `Effect.tryPromise` and map failures to typed errors.

## Middleware (zodvex builders)

`lib/middleware.ts` exports zodvex builders for public and internal functions.

- Public: `query`, `mutation`, `action`
- Internal: `internalQuery`, `internalMutation`, `internalAction`

Use Zod validators for public endpoints. Use Convex `v` validators for internal endpoints.

## Validators Barrel Export

`lib/validators.ts` re-exports schemas and types for frontend consumption.

```typescript
export {
  listArgsSchema,
  listResultSchema,
  type ListArgs,
  type ListResult,
} from "#backend/modules/task/list.validators"
```

Frontend import example:

```typescript
import type { ListResult } from "@acme/backend/validators"
```

## HTTP Endpoints (Example Only)

- `http/http_errors.ts`: typed HTTP errors and `errorToResponse`
- `http/router.ts`: Hono routes
- `http.ts`: Convex `httpRouter` entrypoint

## API Paths

File structure maps to API paths under `api.functions.*`:

| File                  | Export | API Path                     |
| --------------------- | ------ | ---------------------------- |
| `functions/task.ts`   | `list` | `api.functions.task.list`    |
| `functions/task.ts`   | `create` | `api.functions.task.create` |
| `functions/task.ts`   | `toggle` | `api.functions.task.toggle` |
| `functions/task.ts`   | `remove` | `api.functions.task.remove` |

## How To Add A New Endpoint

1. Add validators in `modules/{domain}/{fn}.validators.ts`
2. Add Effect logic in `modules/{domain}/{fn}.ts`
3. Wire handler in `functions/{domain}.ts`
4. Export schemas/types in `lib/validators.ts` (if frontend needs them)

## Conventions

- File names are `snake_case`
- Use `#backend/*` path alias for internal imports
- Prefer early returns over nested `if` blocks
- Avoid `try/catch` where possible; let Effect handle errors
