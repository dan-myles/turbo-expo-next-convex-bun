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
│   └── task/
│       ├── services/
│       │   ├── queries/
│       │   │   ├── index.ts       # Query service functions
│       │   │   ├── types.ts       # Input (z.infer) + Output types
│       │   │   ├── validators.ts  # Zod schemas
│       │   │   └── errors.ts      # Module-specific error enums
│       │   │
│       │   ├── mutations/
│       │   │   ├── index.ts
│       │   │   ├── types.ts
│       │   │   ├── validators.ts
│       │   │   └── errors.ts
│       │   │
│       │   └── internal_mutations/
│       │       ├── index.ts
│       │       ├── types.ts       # Input + Output types (no Zod)
│       │       └── errors.ts
│       │
│       ├── validators.ts          # Re-exports public validators for frontend
│       ├── queries.ts             # Public query handlers
│       ├── mutations.ts           # Public mutation handlers
│       ├── internal_queries.ts    # Internal query handlers
│       ├── internal_mutations.ts  # Internal mutation handlers
│       └── lib.ts                 # Shared helpers
│
├── lib/                           # Shared utilities across modules
│   ├── middleware.ts              # Zod-wrapped query/mutation/action builders
│   ├── errors.ts                  # DatabaseError enum and helpers
│   ├── logger.ts                  # Structured logger
│   └── env.ts                     # Environment variables
│
├── http.ts                        # HTTP routes (webhooks)
└── crons.ts                       # Cron job definitions
```

## Core Patterns

### Path Aliases

Always use the `@acme/backend/*` path alias for imports:

```typescript
// Good
import { DatabaseError, dbError } from "@acme/backend/lib/errors"
import { QueryCtx } from "@acme/backend/_generated/server"
import { Id } from "@acme/backend/_generated/dataModel"

// Avoid
import { DatabaseError } from "../../lib/errors"
```

### Middleware

The `lib/middleware.ts` file exports Zod-wrapped versions of Convex's `query`, `mutation`, and `action` builders using `zodvex`:

```typescript
// convex/lib/middleware.ts
import { zActionBuilder, zMutationBuilder, zQueryBuilder } from "zodvex"
import {
  action as convexAction,
  mutation as convexMutation,
  query as convexQuery,
} from "@acme/backend/_generated/server"

export const query = zQueryBuilder(convexQuery)
export const mutation = zMutationBuilder(convexMutation)
export const action = zActionBuilder(convexAction)
```

**When to use middleware vs raw Convex:**

| Use Case | Import From |
|----------|-------------|
| Public functions with Zod validators | `@acme/backend/lib/middleware` |
| Internal functions with Convex validators | `@acme/backend/_generated/server` |

### Error Handling

#### Database Errors

General database errors live in `lib/errors.ts`:

```typescript
// convex/lib/errors.ts
export enum DatabaseError {
  QUERY_FAILED = "QUERY_FAILED",
  INSERT_FAILED = "INSERT_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED",
  DELETE_FAILED = "DELETE_FAILED",
  NOT_FOUND = "NOT_FOUND",
}

export const dbError = {
  queryFailed: () => DatabaseError.QUERY_FAILED,
  insertFailed: () => DatabaseError.INSERT_FAILED,
  updateFailed: () => DatabaseError.UPDATE_FAILED,
  deleteFailed: () => DatabaseError.DELETE_FAILED,
  notFound: () => DatabaseError.NOT_FOUND,
}
```

#### Module-Specific Errors

Each service defines its own error enum for business logic errors:

```typescript
// convex/modules/task/services/mutations/errors.ts
export enum TaskMutationError {
  DUPLICATE_TASK = "DUPLICATE_TASK",
  INVALID_PRIORITY = "INVALID_PRIORITY",
  TEXT_TOO_LONG = "TEXT_TOO_LONG",
}
```

### Table Definitions

Tables are defined in `/tables` using `zodvex` for validation:

```typescript
// convex/tables/tasks.ts
import { z } from "zod"
import { zodTable } from "zodvex"

export const Tasks = zodTable("tasks", {
  text: z.string(),
  completed: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  createdAt: z.number(),
})
```

The root schema imports and combines all tables:

```typescript
// convex/schema.ts
import { defineSchema } from "convex/server"
import { Tasks } from "./tables/tasks"

export default defineSchema({
  tasks: Tasks.table,
})
```

## Services Layer

Services contain business logic and return `Promise<Result<T, E>>` using neverthrow.

### Service Structure

Each service type (queries, mutations, etc.) has its own folder:

| File | Purpose |
|------|---------|
| `index.ts` | Service functions returning `Promise<Result<T, E>>` |
| `types.ts` | Input types (from `z.infer`) and output types |
| `validators.ts` | Zod schemas for public services |
| `errors.ts` | Module-specific error enums |

### Public Services (with Zod Validators)

**Validators:**

```typescript
// convex/modules/task/services/queries/validators.ts
import { z } from "zod"

export const listTasksInput = z.object({
  completed: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
})

export const getTaskInput = z.object({
  id: z.string(),
})
```

**Types (input inferred from Zod, output defined):**

```typescript
// convex/modules/task/services/queries/types.ts
import { z } from "zod"
import { Doc } from "@acme/backend/_generated/dataModel"
import * as TaskValidators from "./validators"

// Input types INFERRED from Zod validators
export type ListTasksInput = z.infer<typeof TaskValidators.listTasksInput>
export type GetTaskInput = z.infer<typeof TaskValidators.getTaskInput>

// Output types defined explicitly
export type ListTasksOutput = Doc<"tasks">[]
export type GetTaskOutput = Doc<"tasks"> | null
```

**Errors:**

```typescript
// convex/modules/task/services/queries/errors.ts
export enum TaskQueryError {
  INVALID_FILTER = "INVALID_FILTER",
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
}
```

**Service Implementation:**

```typescript
// convex/modules/task/services/queries/index.ts
import { Result, fromPromise, err } from "neverthrow"
import { QueryCtx } from "@acme/backend/_generated/server"
import { Id } from "@acme/backend/_generated/dataModel"
import { DatabaseError, dbError } from "@acme/backend/lib/errors"
import { ListTasksInput, ListTasksOutput, GetTaskInput, GetTaskOutput } from "./types"
import { TaskQueryError } from "./errors"

export async function list(
  ctx: QueryCtx,
  args: ListTasksInput
): Promise<Result<ListTasksOutput, DatabaseError | TaskQueryError>> {
  let query = ctx.db.query("tasks")
  
  if (args.completed !== undefined) {
    query = query.filter((q) => q.eq(q.field("completed"), args.completed))
  }
  
  return await fromPromise(
    query.order("desc").take(args.limit ?? 50),
    dbError.queryFailed
  )
}

export async function get(
  ctx: QueryCtx,
  args: GetTaskInput
): Promise<Result<GetTaskOutput, DatabaseError>> {
  const result = await fromPromise(
    ctx.db.get(args.id as Id<"tasks">),
    dbError.queryFailed
  )
  
  if (result.isErr()) return result
  if (!result.value) return err(DatabaseError.NOT_FOUND)
  
  return result
}
```

### Public Mutations

**Validators:**

```typescript
// convex/modules/task/services/mutations/validators.ts
import { z } from "zod"

export const createTaskInput = z.object({
  text: z.string().min(1).max(500),
  priority: z.enum(["low", "medium", "high"]).optional(),
})

export const updateTaskInput = z.object({
  id: z.string(),
  text: z.string().min(1).max(500).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
})

export const toggleTaskInput = z.object({
  id: z.string(),
})
```

**Types:**

```typescript
// convex/modules/task/services/mutations/types.ts
import { z } from "zod"
import { Id } from "@acme/backend/_generated/dataModel"
import * as TaskValidators from "./validators"

export type CreateTaskInput = z.infer<typeof TaskValidators.createTaskInput>
export type UpdateTaskInput = z.infer<typeof TaskValidators.updateTaskInput>
export type ToggleTaskInput = z.infer<typeof TaskValidators.toggleTaskInput>

export type CreateTaskOutput = Id<"tasks">
export type UpdateTaskOutput = void
export type ToggleTaskOutput = void
```

**Errors:**

```typescript
// convex/modules/task/services/mutations/errors.ts
export enum TaskMutationError {
  DUPLICATE_TASK = "DUPLICATE_TASK",
  INVALID_PRIORITY = "INVALID_PRIORITY",
  TEXT_TOO_LONG = "TEXT_TOO_LONG",
}
```

**Service Implementation:**

```typescript
// convex/modules/task/services/mutations/index.ts
import { Result, fromPromise, err, ok } from "neverthrow"
import { MutationCtx } from "@acme/backend/_generated/server"
import { Id } from "@acme/backend/_generated/dataModel"
import { DatabaseError, dbError } from "@acme/backend/lib/errors"
import {
  CreateTaskInput,
  CreateTaskOutput,
  UpdateTaskInput,
  UpdateTaskOutput,
  ToggleTaskInput,
  ToggleTaskOutput,
} from "./types"
import { TaskMutationError } from "./errors"

export async function create(
  ctx: MutationCtx,
  args: CreateTaskInput
): Promise<Result<CreateTaskOutput, DatabaseError | TaskMutationError>> {
  return await fromPromise(
    ctx.db.insert("tasks", {
      text: args.text,
      priority: args.priority ?? "medium",
      completed: false,
      createdAt: Date.now(),
    }),
    dbError.insertFailed
  )
}

export async function update(
  ctx: MutationCtx,
  args: UpdateTaskInput
): Promise<Result<UpdateTaskOutput, DatabaseError>> {
  const task = await ctx.db.get(args.id as Id<"tasks">)
  
  if (!task) {
    return err(DatabaseError.NOT_FOUND)
  }
  
  return await fromPromise(
    ctx.db.patch(args.id as Id<"tasks">, {
      text: args.text,
      priority: args.priority,
    }),
    dbError.updateFailed
  )
}

export async function toggle(
  ctx: MutationCtx,
  args: ToggleTaskInput
): Promise<Result<ToggleTaskOutput, DatabaseError>> {
  const task = await ctx.db.get(args.id as Id<"tasks">)
  
  if (!task) {
    return err(DatabaseError.NOT_FOUND)
  }
  
  return await fromPromise(
    ctx.db.patch(args.id as Id<"tasks">, { completed: !task.completed }),
    dbError.updateFailed
  )
}
```

### Internal Services (No Zod Validators)

Internal services define types directly without Zod:

**Types:**

```typescript
// convex/modules/task/services/internal_mutations/types.ts
import { Id } from "@acme/backend/_generated/dataModel"

export type CleanupTasksInput = {
  olderThanDays: number
}

export type CleanupTasksOutput = number

export type BulkCreateTasksInput = {
  tasks: { text: string }[]
}

export type BulkCreateTasksOutput = Id<"tasks">[]
```

**Errors:**

```typescript
// convex/modules/task/services/internal_mutations/errors.ts
export enum TaskInternalMutationError {
  CLEANUP_FAILED = "CLEANUP_FAILED",
  BULK_INSERT_FAILED = "BULK_INSERT_FAILED",
}
```

**Service Implementation:**

```typescript
// convex/modules/task/services/internal_mutations/index.ts
import { Result, fromPromise, ok } from "neverthrow"
import { MutationCtx } from "@acme/backend/_generated/server"
import { Id } from "@acme/backend/_generated/dataModel"
import { DatabaseError, dbError } from "@acme/backend/lib/errors"
import { CleanupTasksInput, CleanupTasksOutput, BulkCreateTasksInput, BulkCreateTasksOutput } from "./types"
import { TaskInternalMutationError } from "./errors"

export async function cleanup(
  ctx: MutationCtx,
  args: CleanupTasksInput
): Promise<Result<CleanupTasksOutput, DatabaseError>> {
  const cutoff = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000
  
  const staleResult = await fromPromise(
    ctx.db
      .query("tasks")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect(),
    dbError.queryFailed
  )
  
  if (staleResult.isErr()) return staleResult
  
  for (const task of staleResult.value) {
    await ctx.db.delete(task._id)
  }
  
  return ok(staleResult.value.length)
}

export async function bulkCreate(
  ctx: MutationCtx,
  args: BulkCreateTasksInput
): Promise<Result<BulkCreateTasksOutput, DatabaseError>> {
  const ids: Id<"tasks">[] = []
  
  for (const task of args.tasks) {
    const result = await fromPromise(
      ctx.db.insert("tasks", {
        text: task.text,
        completed: false,
        createdAt: Date.now(),
      }),
      dbError.insertFailed
    )
    
    if (result.isErr()) return result
    ids.push(result.value)
  }
  
  return ok(ids)
}
```

## Handlers

Handlers import services, unwrap Result types, log errors, and throw when necessary.

### Public Query Handlers

```typescript
// convex/modules/task/queries.ts
import { query } from "@acme/backend/lib/middleware"
import { DatabaseError } from "@acme/backend/lib/errors"
import { logger } from "@acme/backend/lib/logger"
import * as TaskValidators from "./services/queries/validators"
import * as TaskQueries from "./services/queries"

export const list = query({
  args: TaskValidators.listTasksInput,
  handler: async (ctx, args) => {
    const result = await TaskQueries.list(ctx, args)
    
    if (result.isErr()) {
      logger.error("Failed to list tasks", { error: result.error, args })
      throw new Error("Failed to list tasks")
    }
    
    return result.value
  },
})

export const get = query({
  args: TaskValidators.getTaskInput,
  handler: async (ctx, args) => {
    const result = await TaskQueries.get(ctx, args)
    
    if (result.isErr()) {
      switch (result.error) {
        case DatabaseError.NOT_FOUND:
          return null
          
        case DatabaseError.QUERY_FAILED:
          logger.error("Failed to get task", { error: result.error, args })
          throw new Error("Failed to get task")
      }
    }
    
    return result.value
  },
})
```

### Public Mutation Handlers

```typescript
// convex/modules/task/mutations.ts
import { mutation } from "@acme/backend/lib/middleware"
import { DatabaseError } from "@acme/backend/lib/errors"
import { logger } from "@acme/backend/lib/logger"
import * as TaskValidators from "./services/mutations/validators"
import * as TaskMutations from "./services/mutations"
import { TaskMutationError } from "./services/mutations/errors"

export const create = mutation({
  args: TaskValidators.createTaskInput,
  handler: async (ctx, args) => {
    const result = await TaskMutations.create(ctx, args)
    
    if (result.isErr()) {
      switch (result.error) {
        case DatabaseError.INSERT_FAILED:
          logger.error("Failed to create task", { error: result.error, args })
          throw new Error("Failed to create task")
          
        case TaskMutationError.TEXT_TOO_LONG:
          throw new Error("Task text exceeds maximum length")
      }
    }
    
    logger.info("Task created", { taskId: result.value })
    return result.value
  },
})

export const update = mutation({
  args: TaskValidators.updateTaskInput,
  handler: async (ctx, args) => {
    const result = await TaskMutations.update(ctx, args)
    
    if (result.isErr()) {
      switch (result.error) {
        case DatabaseError.NOT_FOUND:
          throw new Error("Task not found")
          
        case DatabaseError.UPDATE_FAILED:
          logger.error("Failed to update task", { error: result.error, args })
          throw new Error("Failed to update task")
      }
    }
    
    logger.info("Task updated", { taskId: args.id })
  },
})

export const toggle = mutation({
  args: TaskValidators.toggleTaskInput,
  handler: async (ctx, args) => {
    const result = await TaskMutations.toggle(ctx, args)
    
    if (result.isErr()) {
      switch (result.error) {
        case DatabaseError.NOT_FOUND:
          throw new Error("Task not found")
          
        case DatabaseError.UPDATE_FAILED:
          logger.error("Failed to toggle task", { error: result.error, args })
          throw new Error("Failed to toggle task")
      }
    }
    
    logger.info("Task toggled", { taskId: args.id })
  },
})
```

### Internal Mutation Handlers

Internal handlers use Convex validators inline:

```typescript
// convex/modules/task/internal_mutations.ts
import { v } from "convex/values"
import { internalMutation } from "@acme/backend/_generated/server"
import { DatabaseError } from "@acme/backend/lib/errors"
import { logger } from "@acme/backend/lib/logger"
import * as TaskInternalMutations from "./services/internal_mutations"

export const cleanup = internalMutation({
  args: { olderThanDays: v.number() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const result = await TaskInternalMutations.cleanup(ctx, args)
    
    if (result.isErr()) {
      logger.error("Failed to cleanup tasks", { error: result.error, args })
      throw new Error("Failed to cleanup tasks")
    }
    
    logger.info("Tasks cleaned up", { count: result.value })
    return result.value
  },
})

export const bulkCreate = internalMutation({
  args: { tasks: v.array(v.object({ text: v.string() })) },
  returns: v.array(v.id("tasks")),
  handler: async (ctx, args) => {
    const result = await TaskInternalMutations.bulkCreate(ctx, args)
    
    if (result.isErr()) {
      logger.error("Failed to bulk create tasks", { error: result.error, args })
      throw new Error("Failed to bulk create tasks")
    }
    
    logger.info("Tasks bulk created", { count: result.value.length })
    return result.value
  },
})
```

## Validators Re-export

Re-export public validators for frontend consumption:

```typescript
// convex/modules/task/validators.ts
export * from "./services/queries/validators"
export type { ListTasksInput, GetTaskInput } from "./services/queries/types"

export * from "./services/mutations/validators"
export type { CreateTaskInput, UpdateTaskInput, ToggleTaskInput } from "./services/mutations/types"
```

**Frontend usage:**

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "@acme/backend/_generated/api"
import { createTaskInput, type CreateTaskInput } from "@acme/backend/modules/task/validators"

export function TaskForm() {
  const createTask = useMutation(api.modules.task.mutations.create)
  
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskInput),
  })

  const onSubmit = form.handleSubmit((data) => createTask(data))

  return <form onSubmit={onSubmit}>{/* fields */}</form>
}
```

## Cron Jobs

Define scheduled jobs in `crons.ts`, always using internal functions:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server"
import { internal } from "@acme/backend/_generated/api"

const crons = cronJobs()

crons.daily(
  "cleanup old tasks",
  { hourUTC: 3, minuteUTC: 0 },
  internal.modules.task.internal_mutations.cleanup,
  { olderThanDays: 30 }
)

export default crons
```

## API Paths

File structure maps directly to API paths:

| File | Export | API Path |
|------|--------|----------|
| `modules/task/queries.ts` | `list` | `api.modules.task.queries.list` |
| `modules/task/mutations.ts` | `create` | `api.modules.task.mutations.create` |
| `modules/task/internal_mutations.ts` | `cleanup` | `internal.modules.task.internal_mutations.cleanup` |

## Summary Tables

### Public vs Internal Functions

| Aspect | Public | Internal |
|--------|--------|----------|
| Import handler from | `@acme/backend/lib/middleware` | `@acme/backend/_generated/server` |
| Validators | Zod schemas in `validators.ts` | Convex `v.*` inline |
| Input types | `z.infer<typeof validator>` | Defined directly in `types.ts` |
| Frontend sharing | Yes, via `validators.ts` | No |

### Service File Structure

| File | Public Services | Internal Services |
|------|-----------------|-------------------|
| `index.ts` | Service functions | Service functions |
| `types.ts` | Input (z.infer) + Output | Input + Output (direct) |
| `validators.ts` | Zod schemas | ❌ Not needed |
| `errors.ts` | Error enums | Error enums |

### Scaling Services

When a service grows too large (500+ lines), break it down:

```
services/
└── queries/
    ├── index.ts              # Re-exports all
    ├── list/
    │   ├── index.ts
    │   ├── types.ts
    │   ├── validators.ts
    │   └── errors.ts
    └── search/
        ├── index.ts
        ├── types.ts
        ├── validators.ts
        └── errors.ts
```

## Adding a New Module

1. Create the table definition in `/tables/[name].ts`
2. Add table to `schema.ts`
3. Create module folder `/modules/[name]/`
4. Create services:
   - `services/queries/` with `index.ts`, `types.ts`, `validators.ts`, `errors.ts`
   - `services/mutations/` with `index.ts`, `types.ts`, `validators.ts`, `errors.ts`
   - `services/internal_mutations/` with `index.ts`, `types.ts`, `errors.ts` (no validators)
5. Create handlers: `queries.ts`, `mutations.ts`, `internal_mutations.ts`
6. Create `validators.ts` to re-export public validators
7. Add `lib.ts` for shared helpers if needed

Only create files as needed - not every module requires all file types.
