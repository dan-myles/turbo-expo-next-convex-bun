# Convex Backend Architecture

This document outlines the architecture patterns and conventions for organizing our Convex backend at scale.

## Directory Structure

```
convex/
├── _generated/                    # Auto-generated types (never edit)
│
├── schema.ts                      # Root schema (imports from tables/)
│
├── tables/                        # Table definitions only
│   ├── tasks.ts
│   └── index.ts                   # Re-exports for clean imports
│
├── modules/                       # Feature-based organization
│   ├── task/
│   │   ├── query_validators.ts           # Zod schemas for public query args
│   │   ├── mutation_validators.ts        # Zod schemas for public mutation args
│   │   ├── queries.ts                    # Public queries
│   │   ├── mutations.ts                  # Public mutations
│   │   ├── internal_queries.ts           # Internal queries (validators inline)
│   │   ├── internal_mutations.ts         # Internal mutations (validators inline)
│   │   ├── actions.ts                    # Public actions (optional)
│   │   ├── internal_actions.ts           # Internal actions (optional)
│   │   └── lib.ts                        # Private helpers for this module
│   │
│   └── [feature]/
│       ├── query_validators.ts
│       ├── mutation_validators.ts
│       ├── queries.ts
│       ├── mutations.ts
│       ├── internal_queries.ts
│       ├── internal_mutations.ts
│       ├── actions.ts
│       ├── internal_actions.ts
│       └── lib.ts
│
├── lib/                           # Shared utilities across modules
│   ├── middleware.ts              # Zod-wrapped query/mutation/action builders
│   ├── db.ts                      # Database helpers
│   ├── auth.ts                    # Auth utilities
│   └── validation.ts              # Shared validators
│
├── http.ts                        # HTTP routes (webhooks)
└── crons.ts                       # Cron job definitions
```

## Core Patterns

### Middleware

The `lib/middleware.ts` file exports Zod-wrapped versions of Convex's `query`, `mutation`, and `action` builders using `zodvex`. This enables using Zod schemas directly in function definitions:

```typescript
// convex/lib/middleware.ts
import { zActionBuilder, zMutationBuilder, zQueryBuilder } from "zodvex"
import {
  action as convexAction,
  mutation as convexMutation,
  query as convexQuery,
} from "../_generated/server"

export const query = zQueryBuilder(convexQuery)
export const mutation = zMutationBuilder(convexMutation)
export const action = zActionBuilder(convexAction)
```

**Usage in public functions:**

```typescript
// convex/modules/task/mutations.ts
import { z } from "zod"
import { mutation } from "../../lib/middleware"
import { createTaskInput } from "./mutation_validators"

export const create = mutation({
  args: createTaskInput,
  handler: async (ctx, { text, priority }) => {
    return await ctx.db.insert("tasks", {
      text,
      priority: priority ?? "medium",
      completed: false,
      createdAt: Date.now(),
    })
  },
})
```

**When to use middleware vs raw Convex:**

| Use Case | Import From |
|----------|-------------|
| Public functions with Zod validators | `../../lib/middleware` |
| Internal functions with Convex validators | `../../_generated/server` |

### Table Definitions

Tables are defined in `/tables` using `zodvex` for validation:

```typescript
// convex/tables/users.ts
import { z } from "zod"
import { zodTable } from "zodvex"

export const Users = zodTable("users", {
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "member", "guest"]),
  createdAt: z.number(),
})

export type User = z.infer<typeof Users.schema>
```

The root schema imports and combines all tables:

```typescript
// convex/schema.ts
import { defineSchema } from "convex/server"
import { Users } from "./tables/users"
import { Tasks } from "./tables/tasks"

export default defineSchema({
  users: Users.table,
  tasks: Tasks.table,
})
```

### Module Organization

Each feature module contains:

| File | Purpose |
|------|---------|
| `query_validators.ts` | Zod schemas for public query arguments |
| `mutation_validators.ts` | Zod schemas for public mutation arguments |
| `queries.ts` | Public read operations |
| `mutations.ts` | Public write operations |
| `internal_queries.ts` | Internal read operations (validators inline) |
| `internal_mutations.ts` | Internal write operations (validators inline) |
| `actions.ts` | Public external API calls |
| `internal_actions.ts` | Internal external API calls (validators inline) |
| `lib.ts` | Helper functions, shared logic |

### Validators

Validators are defined using Zod with `z.object()` and live in separate files by function type. Each validator file exports both the schema and the inferred TypeScript type:

```typescript
// convex/modules/task/mutation_validators.ts
import { z } from "zod"

export const createTaskInput = z.object({
  text: z.string().min(1).max(500),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.number().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskInput>

export const updateTaskInput = z.object({
  id: z.string(),
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskInput>

export const toggleTaskInput = z.object({
  id: z.string(),
})

export type ToggleTaskInput = z.infer<typeof toggleTaskInput>
```

```typescript
// convex/modules/task/query_validators.ts
import { z } from "zod"

export const listTasksInput = z.object({
  completed: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  cursor: z.string().optional(),
})

export type ListTasksInput = z.infer<typeof listTasksInput>

export const getTaskInput = z.object({
  id: z.string(),
})

export type GetTaskInput = z.infer<typeof getTaskInput>
```

**Why separate validator files?**

- Share validation logic with frontend for type-safe forms
- Single source of truth for input validation
- Use with React Hook Form + `zodResolver`
- Export types alongside schemas using `z.infer<>`

**Frontend usage:**

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "@acme/backend"
import { 
  createTaskInput, 
  type CreateTaskInput 
} from "@acme/backend/convex/modules/task/mutation_validators"

export function TaskForm() {
  const createTask = useMutation(api.modules.task.mutations.create)
  
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskInput),
  })

  const onSubmit = form.handleSubmit((data) => createTask(data))

  return <form onSubmit={onSubmit}>{/* fields */}</form>
}
```

### Public vs Internal Functions

Public and internal functions live in separate files for clear separation.

**Public functions** use the Zod-wrapped builders from `lib/middleware.ts` with validators from separate files:

```typescript
// convex/modules/task/mutations.ts
import { mutation } from "../../lib/middleware"
import { createTaskInput } from "./mutation_validators"

export const create = mutation({
  args: createTaskInput,
  handler: async (ctx, { text, priority }) => {
    return await ctx.db.insert("tasks", {
      text,
      priority: priority ?? "medium",
      completed: false,
      createdAt: Date.now(),
    })
  },
})
```

**Internal functions** use Convex validators (`v.*`) declared inline. Since internal functions are never called from the frontend, there's no need for separate Zod validator files:

```typescript
// convex/modules/task/internal_mutations.ts
import { v } from "convex/values"
import { internalMutation } from "../../_generated/server"

export const cleanup = internalMutation({
  args: { olderThanDays: v.number() },
  returns: v.number(),
  handler: async (ctx, { olderThanDays }) => {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    const stale = await ctx.db
      .query("tasks")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect()

    for (const task of stale) {
      await ctx.db.delete(task._id)
    }
    return stale.length
  },
})

export const bulkCreate = internalMutation({
  args: { tasks: v.array(v.object({ text: v.string() })) },
  returns: v.array(v.id("tasks")),
  handler: async (ctx, { tasks }) => {
    const ids = []
    for (const t of tasks) {
      ids.push(await ctx.db.insert("tasks", {
        text: t.text,
        completed: false,
        createdAt: Date.now(),
      }))
    }
    return ids
  },
})
```

**When to use internal functions:**

- Cron jobs
- Called from actions
- Admin operations
- Data migrations
- Seeding

**File naming convention:**

| Public | Internal |
|--------|----------|
| `queries.ts` | `internal_queries.ts` |
| `mutations.ts` | `internal_mutations.ts` |
| `actions.ts` | `internal_actions.ts` |
| `query_validators.ts` | *(validators inline)* |
| `mutation_validators.ts` | *(validators inline)* |

**Why internal functions don't need separate validator files:**

- Internal functions are only called from other Convex functions (crons, actions, etc.)
- No frontend form validation needed
- Convex validators (`v.*`) provide runtime type safety
- Keeps the codebase simpler with fewer files

### Helper Functions

Extract reusable logic to `lib.ts` files. Helpers accept context (`QueryCtx`, `MutationCtx`) as the first argument:

```typescript
// convex/modules/task/lib.ts
import { QueryCtx, MutationCtx } from "../../_generated/server"
import { Id } from "../../_generated/dataModel"

export async function getTask(ctx: QueryCtx, id: Id<"tasks">) {
  const task = await ctx.db.get(id)
  if (!task) throw new Error("Task not found")
  return task
}

export async function validateOwnership(
  ctx: QueryCtx,
  taskId: Id<"tasks">,
  userId: string
) {
  const task = await getTask(ctx, taskId)
  if (task.ownerId !== userId) throw new Error("Unauthorized")
  return task
}
```

Use helpers to keep handlers thin:

```typescript
// convex/modules/task/mutations.ts
import { getTask, validateOwnership } from "./lib"

export const complete = mutation({
  args: { id: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error("Unauthorized")

    await validateOwnership(ctx, id, user.subject)
    await ctx.db.patch(id, { completed: true })
    return null
  },
})
```

### Shared Utilities

Common utilities live in `/lib`:

```typescript
// convex/lib/db.ts
import { QueryCtx } from "../_generated/server"
import { Id, TableNames } from "../_generated/dataModel"

export async function getOrThrow<T extends TableNames>(
  ctx: QueryCtx,
  table: T,
  id: Id<T>
) {
  const doc = await ctx.db.get(id)
  if (!doc) throw new Error(`${table} not found: ${id}`)
  return doc
}
```

### Actions for External APIs

Actions run in Node.js and can call external services:

```typescript
// convex/modules/billing/actions.ts
import { v } from "convex/values"
import { action } from "../../_generated/server"
import { internal } from "../../_generated/api"

export const createCheckout = action({
  args: { priceId: v.string() },
  returns: v.string(),
  handler: async (ctx, { priceId }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error("Unauthorized")

    const response = await fetch("https://api.stripe.com/v1/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}` },
      body: JSON.stringify({ price: priceId }),
    })

    const session = await response.json()

    await ctx.runMutation(internal.modules.billing.mutations.recordCheckout, {
      userId: user.subject,
      sessionId: session.id,
    })

    return session.url
  },
})
```

### Cron Jobs

Define scheduled jobs in `crons.ts`, always using internal functions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.daily(
  "cleanup old tasks",
  { hourUTC: 3, minuteUTC: 0 },
  internal.modules.task.internal_mutations.cleanup,
  { olderThanDays: 30 }
)

crons.interval(
  "sync external data",
  { hours: 1 },
  internal.modules.sync.internal_actions.pull,
  {}
)

export default crons
```

## API Paths

File structure maps directly to API paths:

| File | Export | API Path |
|------|--------|----------|
| `modules/task/queries.ts` | `list` | `api.modules.task.queries.list` |
| `modules/task/mutations.ts` | `create` | `api.modules.task.mutations.create` |
| `modules/task/internal_queries.ts` | `stats` | `internal.modules.task.internal_queries.stats` |
| `modules/task/internal_mutations.ts` | `cleanup` | `internal.modules.task.internal_mutations.cleanup` |

## Code Standards

### Always Include Validators

Every function should have `args` and `returns` validators:

```typescript
export const get = query({
  args: { id: v.id("tasks") },
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})
```

### Error Handling

Prefer early returns and let exceptions bubble up:

```typescript
// Good
export const update = mutation({
  args: { id: v.id("tasks"), text: v.string() },
  handler: async (ctx, { id, text }) => {
    const task = await ctx.db.get(id)
    if (!task) throw new Error("Task not found")

    await ctx.db.patch(id, { text })
  },
})

// Avoid
export const update = mutation({
  handler: async (ctx, { id, text }) => {
    try {
      const task = await ctx.db.get(id)
      if (task) {
        await ctx.db.patch(id, { text })
      } else {
        throw new Error("Task not found")
      }
    } catch (e) {
      // unnecessary wrapping
    }
  },
})
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Tables | PascalCase (export), camelCase (schema key) | `Users`, `tasks` |
| Functions | camelCase | `getById`, `createTask` |
| Types | PascalCase | `User`, `TaskStatus` |
| Files | camelCase | `queries.ts`, `lib.ts` |

## Adding a New Module

1. Create the table definition in `/tables/[name].ts`
2. Add table to `schema.ts`
3. Create module folder `/modules/[name]/`
4. Add public validators: `query_validators.ts`, `mutation_validators.ts` (Zod + exported types)
5. Add public functions: `queries.ts`, `mutations.ts`
6. Add internal functions: `internal_queries.ts`, `internal_mutations.ts` (Convex validators inline)
7. Add `lib.ts` for shared helpers
8. Add `actions.ts` / `internal_actions.ts` if external API calls are required

Only create files as needed - not every module requires all file types.
