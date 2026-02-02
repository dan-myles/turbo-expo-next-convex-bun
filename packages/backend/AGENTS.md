# Backend Guidelines (Convex + Effect)

This extends the root AGENTS.md with Convex-specific standards.

## Runtime Information

- **Framework**: Convex with TypeScript
- **Architecture**: Effect for business logic + dependency injection, zodvex for Convex boundary validation
- **Error handling**: Effect with `Data.TaggedError` for typed errors
- **Imports**: Use `#backend/*` path alias for internal imports

## Available Commands

- **Build**: `bun run build`
- **Dev**: `bun run dev`
- **Typecheck**: `bun run typecheck`
- **Test**: `bun run test`
- **Format**: `bun run format` - Checking only
- **Format Fix**: `bun run format:fix` - Writing formatting changes
- **Lint**: `bun run lint` - Checking only
- **Lint Fix**: `bun run lint:fix` - Writing linting changes
- **Clean**: `bun run clean` - Clean cache & modules

---

## Convex-Specific Standards

### File Naming

- **ALWAYS use `snake_case`** for all backend files
- Examples: `list.ts`, `create.validators.ts`, `http_errors.ts`

### Validation

- **EXTERNAL functions** (public API): Use Zod `z` validators via zodvex
- **INTERNAL functions**: Use Convex `v` validators
- Group validators with corresponding modules

### Function Organization

- Use Convex function types: `query`, `mutation`, `action`
- Group related functions in `modules/` by domain
- Place shared utilities in `lib/`
- Define schemas in `tables/` and reference in `schema.ts`

---

## Architecture (Effect + Convex)

### Directory Structure

```
packages/backend/src/
├── services/          # Effect services (dependency injection)
│   ├── ctx.ts         # Query, Mutation, Action context services
│   └── index.ts
├── errors/            # Tagged errors (Data.TaggedError)
│   ├── common.ts      # DatabaseError, StorageError (internal)
│   └── index.ts
├── functions/         # Convex handlers (API endpoints)
│   └── task.ts        # api.functions.task.list
├── modules/           # Business logic (Effects + Validators)
│   └── task/
│       ├── list.ts              # Effect (pure business logic)
│       ├── list.validators.ts   # Zod validators (frontend-safe)
│       ├── create.ts
│       ├── create.validators.ts
│       └── ...
├── http/              # HTTP endpoints (Hono + Convex httpAction)
│   ├── http_errors.ts # Typed HTTP errors
│   └── router.ts      # Hono router
├── lib/
│   ├── middleware.ts  # zodvex builders (query, mutation, action, etc.)
│   └── validators.ts  # Barrel export for frontend
├── tables/
│   └── tasks.ts       # zodTable definitions
├── schema.ts          # Convex schema
└── http.ts            # Convex HTTP entrypoint
```

### File Structure Per Endpoint

Each endpoint consists of three files:

```
modules/{domain}/
├── {function}.validators.ts   # Zod schemas for args and returns
├── {function}.ts              # Effect with business logic
└── {function}.test.ts         # Unit tests (optional)

functions/
└── {domain}.ts                # Handler that wires dependencies
```

---

## Creating Endpoints

### 1. Create Validators (`{function}.validators.ts`)

```typescript
import { z } from "zod"
import { zid } from "zodvex"

// Input args (if endpoint has arguments)
export const listArgsSchema = z.object({})

export type ListArgs = z.infer<typeof listArgsSchema>

// Return type
export const listResultSchema = z.array(
  z.object({
    _id: zid("tasks"),
    text: z.string(),
    completed: z.boolean(),
    createdAt: z.number(),
  })
)

export type ListResult = z.infer<typeof listResultSchema>
```

**Naming Conventions:**

- `{function}ArgsSchema` - Input arguments schema (camelCase + Schema suffix)
- `{function}ResultSchema` - Return schema used in handler (camelCase + Schema suffix)
- `{Function}Args` - Type for arguments (PascalCase)
- `{Function}Result` - Type for return value (PascalCase)

### 2. Create Effect Module (`{function}.ts`)

```typescript
import { Effect } from "effect"

import type { ListArgs, ListResult } from "./list.validators"

import { DatabaseError } from "#backend/errors"
import { Query } from "#backend/services"

export const list = Effect.fn("task.list")(function* (args: ListArgs) {
  const { db } = yield* Query

  const tasks = yield* Effect.tryPromise({
    try: () => db.query("tasks").order("desc").collect(),
    catch: (e) => new DatabaseError({ operation: "query:tasks", cause: e }),
  })

  return tasks satisfies ListResult
})
```

**Key Patterns:**

- Always use `Effect.fn("domain.function")` with span name for tracing
- Use `yield*` to access services
- Wrap async operations with `Effect.tryPromise` and typed errors
- Return with `satisfies` type assertion

### 3. Create Handler (`functions/{domain}.ts`)

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

**Handler Pattern:**

- Import Effect function and validators
- Import appropriate middleware (`query`, `mutation`, `action`)
- Import required services
- Wire with `.pipe(Effect.provide(...), Effect.runPromise)`

### 4. Add to Barrel Export (`lib/validators.ts`)

```typescript
export {
  listArgsSchema,
  listResultSchema,
  type ListArgs,
  type ListResult,
} from "#backend/modules/task/list.validators"
```

Frontend imports: `import { type ListResult } from "@acme/backend/validators"`

---

## Effect Patterns

### Services

Services are accessed via `yield*`:

```typescript
const { db } = yield* Query      // For queries
const { db } = yield* Mutation   // For mutations
const { db } = yield* Action     // For actions
```

### Error Handling

Use `Effect.tryPromise` with typed errors:

```typescript
const result = yield* Effect.tryPromise({
  try: () => db.query("items").collect(),
  catch: (e) => new DatabaseError({ operation: "query:items", cause: e }),
})
```

### Parallel Queries

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

### Early Returns

```typescript
if (items.length === 0) {
  return [] satisfies ResultType
}
```

---

## Error Taxonomy

### Internal Errors

```typescript
import { Data } from "effect"

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string
  cause?: unknown
}> {}
```

### User-Facing Errors

```typescript
export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  taskId?: Id<"tasks">
  userMessage: string
}> {
  constructor(props?: { taskId?: Id<"tasks"> }) {
    super({ taskId: props?.taskId, userMessage: "Task not found" })
  }
}
```

---

## Middleware

### Public Functions

```typescript
import { query, mutation, action } from "#backend/lib/middleware"

export const list = query({ args, returns, handler })
export const create = mutation({ args, returns, handler })
```

### Internal Functions

```typescript
import { internalQuery, internalMutation, internalAction } from "#backend/lib/middleware"

export const cleanup = internalMutation({ args, returns, handler })
```

---

## HTTP Endpoints

### HTTP Errors

```typescript
import { Data } from "effect"

export class BadRequest extends Data.TaggedError("BadRequest")<{
  message?: string
}> {}

export const errorToResponse = (error: unknown): Response => {
  if (error instanceof BadRequest) {
    return Response.json({ message: error.message }, { status: 400 })
  }
  return Response.json({ message: "Internal server error" }, { status: 500 })
}
```

### Hono Router

```typescript
import { Hono } from "hono"

const app = new Hono()

app.get("/health", (c) => c.json({ status: "ok" }))

export default app
```

### Convex HTTP Entrypoint

```typescript
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import app from "./http/router"

const http = httpRouter()

http.route({
  path: "/.*",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    return app.fetch(req, { convex: ctx })
  }),
})

export default http
```

---

## Code Patterns

### Use Maps for O(1) Lookups

```typescript
const itemMap = new Map(items.map((item) => [item._id, item]))

for (const id of ids) {
  const item = itemMap.get(id)
  // ...
}
```

### Early Continues

```typescript
for (const item of items) {
  if (!item?.completedAt) continue

  const record = map.get(item._id)
  if (!record?.finalRank) continue

  // do something...
}
```

---

## Root AGENTS.md Compatibility

This backend follows the root AGENTS.md conventions:

- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Imports**: Named imports preferred
- **Error handling**: Effect patterns (not try/catch)
- **File structure**: Domain-based organization

**Backend-specific overrides:**

- **File naming**: `snake_case` for backend files (Convex convention)
- **Validators**: Zod schemas with camelCase + Schema suffix
